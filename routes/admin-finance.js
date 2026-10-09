const express = require("express");
const router = express.Router();

const MASTER_EMAIL = (process.env.MASTER_ADMIN_EMAIL || "lopessamuca344@gmail.com").trim().toLowerCase();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_FIELDS = [
  "gross_revenue",
  "processing_fees",
  "refunds_and_chargebacks",
  "taxes",
  "eligible_operating_costs"
];

function ready(res) {
  const missing = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    res.status(503).json({ erro: "Financeiro administrativo ainda não configurado no servidor.", faltando: missing });
    return false;
  }
  return true;
}

async function masterFromRequest(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user", {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: "Bearer " + token }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user.email && user.email_confirmed_at && user.email.toLowerCase() === MASTER_EMAIL ? user : null;
}

async function db(path, options = {}) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(base + "/rest/v1/" + path, {
    ...options,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", ...options.headers }
  });
  const body = await response.text();
  if (!response.ok) throw new Error("Supabase HTTP " + response.status + ": " + body.slice(0, 200));
  return body ? JSON.parse(body) : [];
}

router.all("/", async (req, res) => {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ erro: "Método não permitido." });
  if (!ready(res)) return;
  try {
    const master = await masterFromRequest(req);
    if (!master) return res.status(403).json({ erro: "Somente o Administrador Master autenticado pode consultar ou fechar períodos financeiros." });

    if (req.method === "GET") {
      const [periods, shares] = await Promise.all([
        db("lopes_profit_periods?select=id,period_start,period_end,gross_revenue,processing_fees,refunds_and_chargebacks,taxes,eligible_operating_costs,eligible_net_profit,status,created_at,closed_at&order=period_start.desc"),
        db("lopes_assistant_profit_shares?select=id,profit_period_id,assistant_user_id,share_percent,eligible_profit,amount_due,payout_status,provider_transfer_reference,created_at,updated_at,paid_at&order=created_at.desc")
      ]);
      return res.json({ periods, participation_records: shares, automatic_transfers_enabled: false });
    }

    const input = req.body || {};
    if (!DATE_RE.test(String(input.period_start || "")) || !DATE_RE.test(String(input.period_end || ""))) {
      return res.status(400).json({ erro: "Informe period_start e period_end no formato AAAA-MM-DD." });
    }
    if (input.period_end < input.period_start) return res.status(400).json({ erro: "A data final deve ser igual ou posterior à data inicial." });

    const args = { p_period_start: input.period_start, p_period_end: input.period_end };
    for (const field of AMOUNT_FIELDS) {
      const value = input[field];
      if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
        return res.status(400).json({ erro: "Informe valores numéricos não negativos para todos os campos financeiros.", campo: field });
      }
      const key = "p_" + field;
      args[key] = Number(Number(value).toFixed(2));
    }

    const result = await db("rpc/lopes_close_profit_period", { method: "POST", body: JSON.stringify(args) });
    return res.status(201).json({
      mensagem: "Período registrado e participação calculada. Nenhuma transferência foi executada.",
      resultado: result,
      transfer_executed: false
    });
  } catch (error) {
    console.error("Falha no financeiro Master:", error.message);
    if (/já existe|já foi fechado|já existe/i.test(error.message)) {
      return res.status(409).json({ erro: "Este período já foi registrado. Não foi criado outro lançamento." });
    }
    if (/Selecione o Administrador Ajudante/i.test(error.message)) {
      return res.status(409).json({ erro: "Selecione o Administrador Ajudante antes de registrar o lucro." });
    }
    return res.status(500).json({ erro: "Não foi possível processar o financeiro. Confirme se supabase/financial-ledger.sql foi executado no Supabase." });
  }
});

module.exports = router;
