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
        COALESCE(SUM(s.preco), 0) AS faturamento,
        COUNT(DISTINCT a.id) AS total_agendamentos

      FROM agendamentos a
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id

      WHERE EXTRACT(MONTH FROM a.data) = $1
      AND EXTRACT(YEAR FROM a.data) = $2
      `,
      [mes, ano],
    );

    const servicosResult = await pool.query(
      `
      SELECT
        s.nome,
        COUNT(*) AS quantidade

      FROM agendamento_servicos ags
      INNER JOIN servicos s
        ON ags.servico_id = s.id
      INNER JOIN agendamentos a
        ON ags.agendamento_id = a.id

      WHERE EXTRACT(MONTH FROM a.data) = $1
      AND EXTRACT(YEAR FROM a.data) = $2

      GROUP BY s.nome

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
