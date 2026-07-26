const bcrypt = require("bcrypt");

async function gerarHash() {
  const senha = "admin123";

  const hash = await bcrypt.hash(senha, 10);

  console.log(hash);
}

gerarHash();
