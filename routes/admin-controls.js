const express = require("express");
const router = express.Router();
const MASTER_EMAIL = (process.env.MASTER_ADMIN_EMAIL || "lopessamuca344@gmail.com").trim().toLowerCase();

async function adminUser(req) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user", {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: "Bearer " + token }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user.email && user.email_confirmed_at && user.email.toLowerCase() === MASTER_EMAIL ? user : null;
}
async function dbRequest(method, body) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(base + "/rest/v1/lopes_admin_controls?id=eq.main&select=id,value,updated_at", {
    method,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=representation" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  if (!response.ok) throw new Error("Supabase admin controls HTTP " + response.status + ": " + raw.slice(0, 200));
  return raw ? JSON.parse(raw) : [];
}
const DEFAULTS = { integrations: { whatsapp:false, telegram:false, instagram:false, facebook:false, x:false, shopee:false, chatgpt:false }, revokedAuthorities: [], customRules: [] };
router.all("/", async (req, res) => {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ erro: "Método não permitido." });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ erro: "Configure SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY na Vercel." });
  try {
    const admin = await adminUser(req);
    if (!admin) return res.status(403).json({ erro: "Somente o Administrador Master autenticado pode gerenciar estas permissões." });
    if (req.method === "GET") {
      const rows = await dbRequest("GET");
      return res.json({ controls: rows[0]?.value || DEFAULTS });
    }
    const input = req.body || {};
    const integrations = {};
    for (const key of Object.keys(DEFAULTS.integrations)) integrations[key] = input.integrations?.[key] === true;
    const revokedAuthorities = Array.isArray(input.revokedAuthorities) ? [...new Set(input.revokedAuthorities.map(v => String(v).trim().slice(0, 160)).filter(Boolean))].slice(0, 100) : [];
    const customRules = Array.isArray(input.customRules) ? [...new Set(input.customRules.map(v => String(v).trim().slice(0, 500)).filter(Boolean))].slice(0, 50) : [];
    const value = { integrations, revokedAuthorities, customRules };
    const existing = await dbRequest("GET");
    if (existing.length) {
      const rows = await dbRequest("PATCH", { value, updated_by: admin.email, updated_at: new Date().toISOString() });
      return res.json({ mensagem: "Controles administrativos atualizados.", controls: rows[0]?.value || value });
    }
    const base = process.env.SUPABASE_URL.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(base + "/rest/v1/lopes_admin_controls", { method:"POST", headers:{ apikey:key, Authorization:"Bearer "+key, "Content-Type":"application/json", Prefer:"return=representation" }, body:JSON.stringify({id:"main",value,updated_by:admin.email}) });
    const raw = await response.text();
    if (!response.ok) throw new Error("Supabase admin controls HTTP " + response.status + ": " + raw.slice(0, 200));
    const rows = raw ? JSON.parse(raw) : [];
    return res.json({ mensagem:"Controles administrativos criados.", controls:rows[0]?.value || value });
  } catch (error) {
    console.error("Falha nos controles Master:", error.message);
    return res.status(500).json({ erro: "Não foi possível salvar os controles. Confirme se a tabela lopes_admin_controls foi criada no Supabase." });
  }
});
module.exports = router;
