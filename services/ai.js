const config = require("../config");

async function generateAIResponse(message) {
  if (!message || typeof message !== "string") {
    throw new Error("Mensagem inválida");
  }

  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao conectar com o Gemini"
    );
  }

  const assistantMessage =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!assistantMessage) {
    throw new Error("A IA não retornou uma resposta válida");
  }

  return {
    success: true,
    message: assistantMessage
  };
}

module.exports = {
  generateAIResponse
};
