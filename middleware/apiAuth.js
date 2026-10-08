const config = require("../config");

function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!config.jwtSecret) {
    return res.status(503).json({
      erro: "Autenticação da API não configurada"
    });
  }

  if (!apiKey || apiKey !== config.jwtSecret) {
    return res.status(401).json({
      erro: "Chave de API inválida"
    });
  }

  next();
}

module.exports = {
  requireApiKey
};
