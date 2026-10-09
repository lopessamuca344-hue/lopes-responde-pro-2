const express = require("express");
const router = express.Router();

const MASTER_EMAIL = (process.env.MASTER_ADMIN_EMAIL || "lopessamuca344@gmail.com").trim().toLowerCase();

function config(res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    res.status(503).json({ erro: "O cadastro ainda não está conectado. O administrador precisa configurar SUPABASE_URL e SUPABASE_ANON_KEY na Vercel." });
    return false;
  }
  return true;
}
function base() { return process.env.SUPABASE_URL.replace(/\/$/, ""); }
function headers() { return { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" }; }
router.post("/signup", async (req, res) => {
  if (!config(res)) return;
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  const password = String((req.body || {}).password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) return res.status(400).json({ erro: "Informe um e-mail válido e uma senha com pelo menos 10 caracteres." });
  try {
    const r = await fetch(base() + "/auth/v1/signup", { method: "POST", headers: headers(), body: JSON.stringify({ email, password, data: { display_name: email === MASTER_EMAIL ? "Administrador Master" : "" } }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ erro: data.msg || data.message || data.error_description || "Não foi possível criar a conta. Verifique o e-mail e tente novamente." });
    return res.status(201).json({ mensagem: data.session ? "Cadastro criado. Você já pode entrar." : "Cadastro iniciado. Confira seu e-mail e confirme a conta antes de entrar.", precisaConfirmarEmail: !data.session });
  } catch (_) { return res.status(502).json({ erro: "Não foi possível alcançar o serviço de autenticação." }); }
});
router.post("/login", async (req, res) => {
  if (!config(res)) return;
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  const password = String((req.body || {}).password || "");
  if (!email || !password) return res.status(400).json({ erro: "Informe e-mail e senha." });
  try {
    const r = await fetch(base() + "/auth/v1/token?grant_type=password", { method: "POST", headers: headers(), body: JSON.stringify({ email, password }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.access_token) return res.status(401).json({ erro: data.msg || data.message || "E-mail ou senha inválidos. Se acabou de cadastrar, confirme o e-mail primeiro." });
    return res.json({ access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in, user: { email: data.user && data.user.email } });
  } catch (_) { return res.status(502).json({ erro: "Não foi possível alcançar o serviço de autenticação." }); }
});
router.post("/recover", async (req, res) => {
  if (!config(res)) return;
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
  try {
    const r = await fetch(base() + "/auth/v1/recover", { method: "POST", headers: headers(), body: JSON.stringify({ email }) });
    if (!r.ok) { const data = await r.json().catch(() => ({})); return res.status(r.status).json({ erro: data.msg || data.message || "Não foi possível solicitar a recuperação." }); }
    return res.json({ mensagem: "Se houver uma conta para esse e-mail, o serviço enviará as instruções de recuperação." });
  } catch (_) { return res.status(502).json({ erro: "Não foi possível alcançar o serviço de autenticação." }); }
});
router.get("/me", async (req, res) => {
  if (!config(res)) return;
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ erro: "Entre na sua conta." });
  try {
    const r = await fetch(base() + "/auth/v1/user", { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: "Bearer " + token } });
    const user = await r.json().catch(() => ({}));
    if (!r.ok || !user.email) return res.status(401).json({ erro: "Sessão inválida. Entre novamente." });
    return res.json({ email: user.email, emailConfirmado: Boolean(user.email_confirmed_at), isAdmin: user.email.toLowerCase() === MASTER_EMAIL });
  } catch (_) { return res.status(502).json({ erro: "Não foi possível validar sua sessão." }); }
});
module.exports = router;
