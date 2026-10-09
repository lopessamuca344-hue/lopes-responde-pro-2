const crypto = require("crypto");

const PLANOS_TESTE = ["social", "pro", "executiva", "master"];
const CODE_RE = /^[A-Z0-9-]{10,32}$/;

function config(res) {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    res.status(503).json({ erro: "Acesso de teste ainda não configurado no servidor.", faltando: missing });
    return false;
  }
  return true;
}

function supabaseHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

async function db(path, options = {}) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {})
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase respondeu ${response.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

async function authenticatedUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user.email || !user.email_confirmed_at) return null;
  return user;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(`${process.env.TRIAL_CODE_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY}:${code}`).digest("hex");
}

function newCode() {
  return crypto.randomBytes(9).toString("hex").toUpperCase().match(/.{1,6}/g).join("-");
}

module.exports = async function trialAccessRoute(req, res) {
  if (!config(res)) return;
  try {
    if (req.method === "POST" && req.url.split("?")[0] === "/admin/codes") {
      const adminKey = process.env.ADMIN_API_KEY;
      if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
        return res.status(401).json({ erro: "Acesso administrativo não autorizado." });
      }
      const emails = req.body && req.body.emails;
      if (!Array.isArray(emails) || emails.length !== 10) {
        return res.status(400).json({ erro: "Informe exatamente 10 e-mails diferentes e autorizados." });
      }
      const normalized = emails.map((e) => String(e).trim().toLowerCase());
      if (new Set(normalized).size !== 10 || normalized.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
        return res.status(400).json({ erro: "Os 10 e-mails precisam ser válidos e diferentes." });
      }
      const days = Number(process.env.TRIAL_DAYS || 14);
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        return res.status(500).json({ erro: "TRIAL_DAYS deve ser um número entre 1 e 90." });
      }
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      const codes = normalized.map((email) => {
        const code = newCode();
        return { email, code, code_hash: hashCode(code), plans: PLANOS_TESTE, expires_at: expiresAt, revoked: false };
      });
      await db("trial_access_codes", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(codes.map(({ email, code_hash, plans, expires_at, revoked }) => ({ email, code_hash, plans, expires_at, revoked })))
      });
      if (process.env.RESEND_API_KEY && process.env.TRIAL_FROM_EMAIL) {
        const emailResults = await Promise.all(codes.map(async ({ email, code, expires_at }) => {
          try {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: process.env.TRIAL_FROM_EMAIL,
                to: [email],
                subject: "Seu código de teste — Lopes Responde Pro",
                text: "Seu código individual é: " + code + "\\n\\nEle libera os planos Social, Pro, Executiva e Master até " + expires_at + ". Use-o somente na conta associada a este e-mail."
              })
            });
            return { email, enviado: response.ok };
          } catch (_) { return { email, enviado: false }; }
        }));
        return res.status(201).json({ mensagem: "Códigos criados. Confira o resultado do envio por e-mail.", validade_dias: days, emails: emailResults });
      }
      return res.status(201).json({
        mensagem: "10 códigos criados. Envio automático não configurado; guarde os códigos desta resposta administrativa e envie manualmente.",
        validade_dias: days,
        codigos: codes.map(({ email, code, plans, expires_at }) => ({ email, code, planos: plans, expira_em: expires_at }))
      });
    }

    if (req.method === "POST" && req.url.split("?")[0] === "/redeem") {
      const user = await authenticatedUser(req);
      if (!user) return res.status(401).json({ erro: "Entre com uma conta autenticada e e-mail confirmado antes de ativar o código." });
      const code = String((req.body || {}).code || "").trim().toUpperCase();
      if (!CODE_RE.test(code)) return res.status(400).json({ erro: "Código inválido." });
      const rows = await db(`trial_access_codes?code_hash=eq.${encodeURIComponent(hashCode(code))}&select=id,email,plans,expires_at,revoked,redeemed_by`);
      const item = rows && rows[0];
      if (!item || item.revoked || item.redeemed_by || new Date(item.expires_at) <= new Date() || item.email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({ erro: "Código inválido, expirado, já utilizado ou destinado a outro e-mail." });
      }
      const updated = await db(`trial_access_codes?id=eq.${item.id}&redeemed_by=is.null&revoked=eq.false`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ redeemed_by: user.id, redeemed_at: new Date().toISOString() })
      });
      if (!updated || updated.length !== 1) return res.status(409).json({ erro: "Este código já foi utilizado ou revogado." });
      return res.status(200).json({ ativo: true, planos: item.plans, expira_em: item.expires_at });
    }

    if (req.method === "GET" && req.url.split("?")[0] === "/me") {
      const user = await authenticatedUser(req);
      if (!user) return res.status(401).json({ erro: "Autenticação necessária." });
      const rows = await db(`trial_access_codes?redeemed_by=eq.${encodeURIComponent(user.id)}&revoked=eq.false&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=plans,expires_at`);
      if (!rows || !rows.length) return res.status(200).json({ ativo: false, planos: [] });
      return res.status(200).json({ ativo: true, planos: rows[0].plans, expira_em: rows[0].expires_at });
    }

    if (req.method === "POST" && req.url.split("?")[0] === "/admin/revoke") {
      const adminKey = process.env.ADMIN_API_KEY;
      if (!adminKey || req.headers["x-admin-key"] !== adminKey) return res.status(401).json({ erro: "Acesso administrativo não autorizado." });
      const id = String((req.body || {}).id || "");
      const email = String((req.body || {}).email || "").trim().toLowerCase();
      if (!id && !email) return res.status(400).json({ erro: "Informe o id do código ou o e-mail autorizado." });
      const filter = id ? `id=eq.${encodeURIComponent(id)}` : `email=eq.${encodeURIComponent(email)}`;
      const rows = await db(`trial_access_codes?${filter}&select=id`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ revoked: true }) });
      return res.status(200).json({ revogados: rows ? rows.length : 0 });
    }

    res.status(404).json({ erro: "Rota de acesso de teste não encontrada." });
  } catch (error) {
    console.error("Falha em acesso de teste:", error.message);
    res.status(500).json({ erro: "Não foi possível processar o acesso de teste. Confira a configuração do banco." });
  }
};
