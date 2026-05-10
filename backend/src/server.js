require("./database/db");

const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientesRoutes");
const authRoutes = require("./routes/authRoutes");
const servicosRoutes = require("./routes/servicosRoutes");
const agendamentosRoutes = require("./routes/agendamentosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/clientes", clientesRoutes);
app.use("/auth", authRoutes);
app.use("/servicos", servicosRoutes);
app.use("/agendamentos", agendamentosRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API BarberFlow funcionando!");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
