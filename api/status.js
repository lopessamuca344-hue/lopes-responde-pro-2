module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      status: "error",
      erro: "Método não permitido"
    });
  }

  return res.status(200).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    api: "respondendo",
    iaConfigurada: Boolean(process.env.GEMINI_API_KEY),
    observacao: "Este diagnóstico nunca retorna a chave secreta."
  });
};
