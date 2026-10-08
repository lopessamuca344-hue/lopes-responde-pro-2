const { processChatMessage } = require("../services/chat");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    const { message } = req.body || {};

    const result = await processChatMessage(message);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
};
