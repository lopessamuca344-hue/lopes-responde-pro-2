const config = require("../config");

function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!config.jwtSecret) {
    res.status(503).json({
      erro: "Autenticação da API não configurada"
    });

    return false;
  }

  if (!apiKey || apiKey !== config.jwtSecret) {
    res.status(401).json({
      erro: "Chave de API inválida"
    });

    return false;
  }

  if (typeof next === "function") {
    next();
  }

  return true;
}

module.exports = {
  requireApiKey
};
