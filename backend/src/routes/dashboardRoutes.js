const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const mes = req.query.mes;
    const ano = req.query.ano;

    const faturamentoResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(servicos.preco), 0) AS faturamento,
        COUNT(agendamentos.id) AS total_agendamentos

      FROM agendamentos

      INNER JOIN servicos
        ON agendamentos.servico_id = servicos.id

      WHERE EXTRACT(MONTH FROM agendamentos.data) = $1
      AND EXTRACT(YEAR FROM agendamentos.data) = $2
      `,
      [mes, ano],
    );

    const servicosResult = await pool.query(
      `
      SELECT
        servicos.nome,
        COUNT(*) AS quantidade

      FROM agendamentos

      INNER JOIN servicos
        ON agendamentos.servico_id = servicos.id

      WHERE EXTRACT(MONTH FROM agendamentos.data) = $1
      AND EXTRACT(YEAR FROM agendamentos.data) = $2

      GROUP BY servicos.nome

      ORDER BY quantidade DESC
      `,
      [mes, ano],
    );

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
