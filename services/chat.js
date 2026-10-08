const { generateAIResponse } = require("./ai");

async function processChatMessage(message) {
  if (!message || typeof message !== "string") {
    throw new Error("Mensagem inválida");
  }

  const response = await generateAIResponse(message);

  return {
    success: response.success,
    userMessage: message,
    assistantMessage: response.message
  };
}

module.exports = {
  processChatMessage
};
