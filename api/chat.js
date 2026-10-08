const { processChatMessage } = require("../services/chat");
const { requireApiKey } = require("../middleware/apiAuth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  const autorizado = requireApiKey(req, res, () => {});

  if (!autorizado) {
    return;
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        erro: "Mensagem inválida"
      });
    }

    const result = await processChatMessage(message);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      erro: error.message || "Erro interno do servidor"
    });
  }
};
