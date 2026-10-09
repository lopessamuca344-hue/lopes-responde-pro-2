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
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let response;
  let data;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTIONS }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: message.trim() }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );
    data = await response.json().catch(() => ({}));
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tempo limite excedido ao consultar a IA");
    }
    throw new Error("Falha de rede ao consultar a IA");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Não repassar detalhes do provedor nem dados de requisição ao usuário.
    console.error("Gemini API respondeu com status:", response.status);
    throw new Error("Erro ao conectar com o Gemini");
  }

  const assistantMessage = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!assistantMessage) {
    throw new Error("A IA não retornou uma resposta válida");
  }

  return { success: true, message: assistantMessage };
}

module.exports = { generateAIResponse };
