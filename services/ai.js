const config = require("../config");

async function generateAIResponse(message) {
  if (!message || typeof message !== "string") {
    throw new Error("Mensagem inválida");
  }

  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    return {
      success: false,
      message:
        "O mecanismo de inteligência artificial ainda não está configurado."
    };
  }

  return {
    success: true,
    message: "Integração com o mecanismo de IA preparada."
  };
}

module.exports = {
  generateAIResponse
};
