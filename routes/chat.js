const { processChatMessage } = require("../services/chat");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        erro: "Digite uma mensagem válida."
      });
    }

    if (message.length > 4000) {
      return res.status(413).json({
        erro: "A mensagem ultrapassa o limite de 4.000 caracteres."
      });
    }

    const result = await processChatMessage(message.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro em /api/chat:", error);
    const message = error?.message || "";

    if (message.includes("GEMINI_API_KEY não configurada")) {
      return res.status(503).json({
        erro: "A IA ainda não está configurada no servidor. Verifique a variável GEMINI_API_KEY no Vercel."
      });
    }

    return res.status(502).json({
      erro: "Não foi possível obter uma resposta do Gemini. Verifique a configuração da IA e tente novamente."
    });
  }
};
