const { processChatMessage } = require("../services/chat");

// Limite básico para o protótipo. Em produção, trocar por rate limit compartilhado.
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const requestsByIp = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = requestsByIp.get(ip);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestsByIp.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({
      erro: "Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente."
    });
  }

  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ erro: "Digite uma mensagem válida." });
    }

    if (message.length > 4000) {
      return res.status(413).json({
        erro: "A mensagem é muito longa. O limite é de 4.000 caracteres."
      });
    }

    const result = await processChatMessage(message.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error("Falha no endpoint /api/chat:", error?.message || error);
    const missingKey = !process.env.GEMINI_API_KEY;
    return res.status(missingKey ? 503 : 502).json({
      erro: missingKey
        ? "O administrador precisa configurar GEMINI_API_KEY na Vercel."
        : "Não foi possível obter resposta da IA. Verifique a chave e a configuração do Gemini."
    });
  }
};
