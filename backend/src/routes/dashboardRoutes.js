const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const faturamentoResult = await pool.query(`
      SELECT
        COALESCE(SUM(servicos.preco), 0) AS faturamento,
        COUNT(agendamentos.id) AS total_agendamentos

      FROM agendamentos

      INNER JOIN servicos
        ON agendamentos.servico_id = servicos.id
    `);

    const servicosResult = await pool.query(`
      SELECT
        servicos.nome,
        COUNT(*) AS quantidade

      FROM agendamentos

      INNER JOIN servicos
        ON agendamentos.servico_id = servicos.id

      GROUP BY servicos.nome

      ORDER BY quantidade DESC
    `);

    res.json({
      resumo: faturamentoResult.rows[0],
      servicos: servicosResult.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao carregar dashboard",
    });
  }
});

module.exports = router;
