const { processChatMessage } = require("../services/chat");
const { requireApiKey } = require("../middleware/apiAuth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  try {
    await new Promise((resolve, reject) => {
      requireApiKey(req, res, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const { message } = req.body || {};

    const result = await processChatMessage(message);

    return res.status(200).json(result);

  } catch (error) {
    if (res.headersSent) {
      return;
    }

    return res.status(401).json({
      erro: error.message || "Não autorizado"
    });
  }
};
