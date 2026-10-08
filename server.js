const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET" && req.url === "/api/status") {
    res.writeHead(200);

    res.end(
      JSON.stringify({
        projeto: "Lopes Responde Pro 2.0",
        status: "online",
        versao: "2.0",
        ambiente: "desenvolvimento"
      })
    );

    return;
  }

  res.writeHead(404);

  res.end(
    JSON.stringify({
      erro: "Rota não encontrada"
    })
  );
});

server.listen(PORT, () => {
  console.log(`Lopes Responde Pro 2.0 rodando na porta ${PORT}`);
});
