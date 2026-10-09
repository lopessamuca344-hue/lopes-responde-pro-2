const fs = require("node:fs");
const vm = require("node:vm");

const sourceFiles = [
  "server.js",
  "config.js",
  "services/ai.js",
  "services/chat.js",
  "services/admin-controls.js",
  "routes/chat.js",
  "routes/auth.js",
  "routes/admin-controls.js",
  "routes/admin-assistants.js",
  "routes/trial-access.js"
];

let checked = 0;
for (const file of sourceFiles) {
  if (!fs.existsSync(file)) throw new Error("Arquivo obrigatório ausente: " + file);
  new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
  checked++;
}

const html = fs.readFileSync("index.html", "utf8");
const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .filter((match) => match[1].trim());
if (!inlineScripts.length) throw new Error("Nenhum script JavaScript encontrado em index.html");
inlineScripts.forEach((match, index) => {
  new vm.Script(match[1], { filename: "index.html:inline-script-" + (index + 1) });
  checked++;
});

console.log("Verificação de sintaxe aprovada: " + checked + " arquivos/scripts JavaScript.");
