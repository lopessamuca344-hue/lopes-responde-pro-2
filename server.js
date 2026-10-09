const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));

// Página inicial: mostrar a interface, não o JSON de status.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Status do servidor para verificações técnicas.
app.get("/api/status", (req, res) => {
  res.status(200).json({
    projeto: "Lopes Responde Pro 2.0",
    status: "online",
    versao: "2.0"
  });
});

// Chat com a IA.
const chatRoute = require("./routes/chat");
app.post("/api/chat", chatRoute);

// Cadastro, login e recuperação de senha.
app.use("/api/auth", require("./routes/auth"));

// Controles privados de integração e revogação do Administrador Master.
app.use("/api/admin/controls", require("./routes/admin-controls"));

// Administração privada dos candidatos e do único Administrador Ajudante.
app.use("/api/admin/assistants", require("./routes/admin-assistants"));

// Consulta e fechamento de períodos financeiros; não executa transferências.
app.use("/api/admin/finance", require("./routes/admin-finance"));

// Controle de códigos individuais de teste (banco e autenticação externos).
const trialAccessRoute = require("./routes/trial-access");
app.use("/api/trial-access", trialAccessRoute);

// Rota não encontrada.
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`Lopes Responde Pro 2.0 rodando na porta ${PORT}`);
});
