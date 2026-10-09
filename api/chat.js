const { processChatMessage } = require("../services/chat");

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

  if (isRateLimited(getClientIp(req))) {
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
      return res.status(413).json({ erro: "A mensagem é muito longa. O limite é de 4.000 caracteres." });
    }
    return res.status(200).json(await processChatMessage(message.trim()));
  } catch (error) {
    const code = error?.code || "";
    console.error("Falha no endpoint /api/chat:", code, error?.message || "erro sem mensagem");

    if (code === "MISSING_API_KEY" || (error?.message || "").includes("GEMINI_API_KEY não configurada")) {
      return res.status(503).json({ erro: "A IA não está configurada: falta GEMINI_API_KEY no ambiente Production da Vercel." });
    }
    if (code === "GEMINI_HTTP_400" || code === "GEMINI_HTTP_404") {
      return res.status(502).json({ erro: "O Gemini recusou a configuração do modelo. O registro técnico foi atualizado para identificar a causa." });
    }
    if (code === "GEMINI_HTTP_401" || code === "GEMINI_HTTP_403") {
      return res.status(502).json({ erro: "O Gemini recusou a chave de API ou a permissão do projeto. É necessário corrigir a chave ou a autorização no Google AI Studio." });
    }
    if (code === "GEMINI_HTTP_429") {
      return res.status(502).json({ erro: "O Gemini informou limite de uso ou cota excedida. Verifique a cota do projeto no Google AI Studio." });
    }
    if (code === "GEMINI_TIMEOUT") {
      return res.status(504).json({ erro: "O Gemini demorou demais para responder. Tente novamente em instantes." });
    }
    return res.status(502).json({ erro: "Não foi possível obter resposta da IA. O registro técnico agora identifica melhor a causa." });
  }
};
