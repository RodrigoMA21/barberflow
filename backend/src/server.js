require("./database/db");

const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientesRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/clientes", clientesRoutes);

app.get("/", (req, res) => {
  res.send("API BarberFlow funcionando!");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
