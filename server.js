const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota principal
app.get("/", (req, res) => {
  res.status(200).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    versao: "2.0"
  });
});

// Status
app.get("/api/status", (req, res) => {
  res.status(200).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    versao: "2.0",
    ambiente: "desenvolvimento"
  });
});

// Chat
const chatRoute = require("./routes/chat");
app.post("/api/chat", chatRoute);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada"
  });
});

app.listen(PORT, () => {
  console.log(`Lopes Responde Pro 2.0 rodando na porta ${PORT}`);
});
