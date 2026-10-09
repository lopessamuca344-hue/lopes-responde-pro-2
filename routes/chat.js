const { processChatMessage } = require("../services/chat");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { message } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ erro: "Digite uma mensagem válida." });
    }
    if (message.length > 4000) {
      return res.status(413).json({ erro: "A mensagem ultrapassa o limite de 4.000 caracteres." });
    }
    return res.status(200).json(await processChatMessage(message.trim()));
  } catch (error) {
    const code = error?.code || "";
    console.error("Erro em /api/chat:", code, error?.message || "erro sem mensagem");

    if (code === "MISSING_API_KEY" || (error?.message || "").includes("GEMINI_API_KEY não configurada")) {
      return res.status(503).json({ erro: "A IA não está configurada: falta GEMINI_API_KEY no ambiente Production da Vercel." });
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
