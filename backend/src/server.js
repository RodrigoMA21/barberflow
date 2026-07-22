require("./database/db");

const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientesRoutes");
const authRoutes = require("./routes/authRoutes");
const servicosRoutes = require("./routes/servicosRoutes");
const agendamentosRoutes = require("./routes/agendamentosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const barbeirosRoutes = require("./routes/barbeirosRoutes");
const { authenticateToken } = require("./middlewares/authMiddleware");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);

app.use("/clientes", authenticateToken, clientesRoutes);
app.use("/servicos", authenticateToken, servicosRoutes);
app.use("/barbeiros", authenticateToken, barbeirosRoutes);
app.use("/agendamentos", authenticateToken, agendamentosRoutes);
app.use("/dashboard", authenticateToken, dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API BarberFlow funcionando!");
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
