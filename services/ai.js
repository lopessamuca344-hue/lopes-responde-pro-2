const config = require("../config");

const SYSTEM_INSTRUCTIONS = [
  "Você é Lopes, o assistente do Lopes Responde Pro, com postura profissional, clara, respeitosa e prática.",
  "Responda em português brasileiro por padrão, salvo se a pessoa pedir outro idioma.",
  "Ajude com organização, atendimento, comunicação, planejamento e tarefas administrativas não financeiras.",
  "Nunca peça, revele ou armazene senhas, chaves de API, códigos de autenticação ou dados bancários completos.",
  "Não afirme que executou ações externas, publicou conteúdo, enviou mensagens, acessou contas ou verificou dados se isso não ocorreu por uma integração autorizada.",
  "Não faça transferências, pagamentos, alterações de Pix, movimentações de carteira/cofre, mudanças de preço, planos ou regras financeiras. Encaminhe essas decisões ao Administrador Master para autorização explícita.",
  "Não alegue ser advogado, contador ou profissional licenciado; em assuntos legais ou financeiros, ofereça informação geral e recomende validação profissional quando necessário.",
  "Se uma solicitação depender de acesso a uma conta ou integração que ainda não esteja conectada, explique isso claramente e ofereça o próximo passo seguro.",
  "Seja objetivo. Quando faltarem informações essenciais, faça uma pergunta direta."
].join("\n");

async function generateAIResponse(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Mensagem inválida");
  }

  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY não configurada");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let response;
  let data;

  try {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          contents: [{ role: "user", parts: [{ text: message.trim() }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
        })
      }
    );
    data = await response.json().catch(() => ({}));
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Tempo limite excedido ao consultar a IA");
      timeoutError.code = "GEMINI_TIMEOUT";
      throw timeoutError;
    }
    const networkError = new Error("Falha de rede ao consultar a IA");
    networkError.code = "GEMINI_NETWORK";
    throw networkError;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const providerMessage = data?.error?.message || "Sem detalhes do provedor";
    console.error("Gemini API falhou:", JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      message: providerMessage
    }));

    const error = new Error("Gemini API respondeu com status " + response.status);
    error.code = "GEMINI_HTTP_" + response.status;
    throw error;
  }

  const assistantMessage = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!assistantMessage) {
    console.error("Gemini não retornou texto:", JSON.stringify({
      promptFeedback: data?.promptFeedback?.blockReason || null,
      candidateFinishReason: data?.candidates?.[0]?.finishReason || null
    }));
    const error = new Error("A IA não retornou uma resposta válida");
    error.code = "GEMINI_EMPTY_RESPONSE";
    throw error;
  }

  return { success: true, message: assistantMessage };
}

module.exports = { generateAIResponse };
