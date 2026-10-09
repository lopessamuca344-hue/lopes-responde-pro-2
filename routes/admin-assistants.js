const express = require("express");
const router = express.Router();

const MASTER_EMAIL = (process.env.MASTER_ADMIN_EMAIL || "lopessamuca344@gmail.com").trim().toLowerCase();
const ALLOWED_PERMISSIONS = new Set([
  "support_review",
  "content_moderation",
  "tester_management",
  "user_feedback",
  "basic_analytics"
]);

function ready(res) {
  const missing = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]);
  if (missing.length) {
    res.status(503).json({ erro: "Administração de ajudantes ainda não configurada no servidor.", faltando: missing });
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

async function findConfirmedUserByEmail(email) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (let page = 1; page <= 20; page++) {
    const url = base + "/auth/v1/admin/users?page=" + page + "&per_page=1000";
    const response = await fetch(url, { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!response.ok) throw new Error("Não foi possível consultar usuários no Supabase Auth.");
    const data = await response.json();
    const users = Array.isArray(data.users) ? data.users : [];
    const found = users.find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found.email_confirmed_at ? found : null;
    if (users.length < 1000) break;
  }
  return null;
}

async function db(path, options = {}) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(base + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error("Supabase HTTP " + response.status + ": " + body.slice(0, 180));
  return body ? JSON.parse(body) : [];
}

function cleanPermissions(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String))].filter((permission) => ALLOWED_PERMISSIONS.has(permission));
}

router.all("/", async (req, res) => {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ erro: "Método não permitido." });
  if (!ready(res)) return;
  try {
    const master = await masterFromRequest(req);
    if (!master) return res.status(403).json({ erro: "Somente o Administrador Master autenticado pode gerenciar o Ajudante." });
    const action = String(req.query.action || (req.body || {}).action || "").toLowerCase();

    if (req.method === "GET") {
      const rows = await db("lopes_admin_assistants?select=id,user_id,email,display_name,status,permissions,evaluation_notes,selected_by,selected_at,created_at,updated_at&order=created_at.asc");
      return res.json({ candidatos: rows, maximo_candidatos: 10, permissoes_disponiveis: [...ALLOWED_PERMISSIONS] });
    }

    const input = req.body || {};
    if (action === "candidate") {
      const email = String(input.email || "").trim().toLowerCase();
      const displayName = String(input.display_name || "").trim().slice(0, 100);
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "Informe um e-mail válido de uma conta já cadastrada e confirmada no aplicativo." });
      }
      const account = await findConfirmedUserByEmail(email);
      if (!account) return res.status(404).json({ erro: "Não encontrei uma conta confirmada com esse e-mail. A pessoa precisa se cadastrar e confirmar o e-mail primeiro." });
      const userId = account.id;
      const existing = await db("lopes_admin_assistants?select=id,user_id,email,status");
      const already = existing.find((item) => item.user_id === userId || String(item.email || "").toLowerCase() === email);
      if (already) return res.status(409).json({ erro: "Esta conta já está cadastrada como candidata ou Ajudante." });
      if (existing.filter((item) => item.status !== "revoked").length >= 10) {
        return res.status(409).json({ erro: "O limite de 10 candidatos já foi atingido. Revogue uma candidatura antes de adicionar outra." });
      }
      const rows = await db("lopes_admin_assistants", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([{ user_id: userId, email, display_name: displayName, status: "candidate", permissions: [], selected_by: master.email }])
      });
      return res.status(201).json({ mensagem: "Candidato cadastrado.", candidato: rows[0] });
    }

    if (action === "select") {
      const id = String(input.id || "").trim();
      const permissions = cleanPermissions(input.permissions);
      if (!id) return res.status(400).json({ erro: "Informe o ID do candidato." });
      const rows = await db("lopes_admin_assistants?select=id,user_id,status");
      const candidate = rows.find((item) => item.id === id);
      if (!candidate || candidate.status !== "candidate") return res.status(404).json({ erro: "Candidato não encontrado ou não está disponível para seleção." });
      if (!permissions.length) return res.status(400).json({ erro: "Conceda pelo menos uma permissão limitada ao Ajudante." });
      const active = rows.find((item) => item.status === "active");
      if (active) return res.status(409).json({ erro: "Já existe um Ajudante ativo. Revogue o atual antes de selecionar outro." });
      const updated = await db("lopes_admin_assistants?id=eq." + encodeURIComponent(id) + "&status=eq.candidate", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "active", permissions, selected_by: master.email, selected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      });
      if (!updated.length) return res.status(409).json({ erro: "O candidato mudou de estado; atualize a lista e tente novamente." });
      return res.json({ mensagem: "Ajudante selecionado com permissões limitadas.", ajudante: updated[0] });
    }

    if (action === "revoke") {
      const id = String(input.id || "").trim();
      if (!id) return res.status(400).json({ erro: "Informe o ID do candidato ou Ajudante." });
      const updated = await db("lopes_admin_assistants?id=eq." + encodeURIComponent(id) + "&status=neq.revoked", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "revoked", permissions: [], updated_at: new Date().toISOString() })
      });
      return res.json({ mensagem: "Permissões revogadas.", registros: updated.length });
    }

    if (action === "permissions") {
      const id = String(input.id || "").trim();
      const permissions = cleanPermissions(input.permissions);
      if (!id) return res.status(400).json({ erro: "Informe o ID do Ajudante." });
      const updated = await db("lopes_admin_assistants?id=eq." + encodeURIComponent(id) + "&status=eq.active", {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ permissions, updated_at: new Date().toISOString() })
      });
      if (!updated.length) return res.status(404).json({ erro: "Ajudante ativo não encontrado." });
      return res.json({ mensagem: "Permissões atualizadas pelo Administrador Master.", ajudante: updated[0] });
    }

    return res.status(400).json({ erro: "Ação inválida. Use candidate, select, permissions ou revoke." });
  } catch (error) {
    console.error("Falha ao gerenciar Ajudante:", error.message);
    return res.status(500).json({ erro: "Não foi possível concluir a operação. Confira se supabase/financial-ledger.sql foi executado no Supabase." });
  }
});

module.exports = router;
