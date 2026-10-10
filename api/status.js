module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      status: "error",
      erro: "Método não permitido"
    });
  }

  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const supportedProvider = provider === "openai" || provider === "gemini";
  const iaConfigurada = provider === "openai"
    ? Boolean(process.env.OPENAI_API_KEY)
    : provider === "gemini"
      ? Boolean(process.env.GEMINI_API_KEY)
      : false;

  return res.status(supportedProvider ? 200 : 503).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    api: "respondendo",
    provedor: supportedProvider ? provider : "não suportado",
    iaConfigurada,
    observacao: iaConfigurada
      ? "A variável de configuração do provedor selecionado está presente. Isso não garante que a chave ou a cota do provedor sejam válidas."
      : "Configure a chave privada do provedor selecionado no ambiente Production da Vercel e faça uma nova implantação. Nenhuma chave secreta é exibida."
  });
};
