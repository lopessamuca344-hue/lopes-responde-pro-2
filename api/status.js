module.exports = (req, res) => {
  res.status(200).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    versao: "2.0",
    ambiente: process.env.NODE_ENV || "development"
  });
};
