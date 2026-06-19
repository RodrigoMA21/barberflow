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

    // faturamento do dia (hoje)
    const faturamentoDiaResult = await pool.query(
      `
      SELECT COALESCE(SUM(s.preco), 0) AS faturamento_dia
      FROM agendamentos a
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      WHERE a.data::date = CURRENT_DATE
      `,
    );

    // faturamento do ano
    const faturamentoAnoResult = await pool.query(
      `
      SELECT COALESCE(SUM(s.preco), 0) AS faturamento_ano
      FROM agendamentos a
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      WHERE EXTRACT(YEAR FROM a.data) = $1
      `,
      [ano],
    );

    // faturamento por mês do ano selecionado
    const faturamentoMensalResult = await pool.query(
      `
      WITH meses AS (
        SELECT generate_series(1, 12) AS mes
      )
      SELECT
        meses.mes,
        COALESCE(SUM(s.preco), 0) AS faturamento
      FROM meses
      LEFT JOIN agendamentos a
        ON EXTRACT(MONTH FROM a.data) = meses.mes
       AND EXTRACT(YEAR FROM a.data) = $1
      LEFT JOIN agendamento_servicos ags
        ON a.id = ags.agendamento_id
      LEFT JOIN servicos s
        ON ags.servico_id = s.id
      GROUP BY meses.mes
      ORDER BY meses.mes
      `,
      [ano],
    );

    const indicadoresResult = await pool.query(
      `
      WITH agendamentos_periodo AS (
        SELECT
          a.id,
          a.cliente_id,
          a.status,
          COALESCE(SUM(s.preco), 0) AS total
        FROM agendamentos a
        LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
        LEFT JOIN servicos s ON ags.servico_id = s.id
        WHERE EXTRACT(MONTH FROM a.data) = $1
          AND EXTRACT(YEAR FROM a.data) = $2
          AND a.status <> 'cancelado'
        GROUP BY a.id, a.cliente_id, a.status
      )
      SELECT
        COALESCE((
          SELECT s.nome
          FROM agendamentos_periodo ap
          INNER JOIN agendamento_servicos ags ON ap.id = ags.agendamento_id
          INNER JOIN servicos s ON ags.servico_id = s.id
          GROUP BY s.nome
          ORDER BY COUNT(*) DESC, s.nome ASC
          LIMIT 1
        ), '—') AS servico_mais_vendido,
        COALESCE((
          SELECT c.nome
          FROM agendamentos_periodo ap
          INNER JOIN clientes c ON ap.cliente_id = c.id
          GROUP BY c.nome
          ORDER BY COUNT(*) DESC, c.nome ASC
          LIMIT 1
        ), '—') AS cliente_que_mais_agendou,
        COALESCE(ROUND(AVG(total)::numeric, 2), 0) AS ticket_medio,
        COUNT(*) FILTER (WHERE status = 'concluido') AS total_atendimentos_concluidos
      FROM agendamentos_periodo
      `,
      [mes, ano],
    );

    const totalClientesResult = await pool.query(
      `SELECT COUNT(*) AS total_clientes FROM clientes`,
    );

    const totalBarbeirosAtivosResult = await pool.query(
      `SELECT COUNT(*) AS total_barbeiros_ativos FROM barbeiros WHERE ativo = TRUE`,
    );

    const seriesMensal = faturamentoMensalResult.rows.map((row) => ({
      mes: Number(row.mes),
      faturamento: Number(row.faturamento) || 0,
    }));

    res.json({
      resumo: {
        ...faturamentoResult.rows[0],
        faturamento_dia: faturamentoDiaResult.rows[0].faturamento_dia,
        faturamento_ano: faturamentoAnoResult.rows[0].faturamento_ano,
      },
      servicos: servicosResult.rows,
      series_mensal: seriesMensal,
      indicadores: {
        servico_mais_vendido: indicadoresResult.rows[0].servico_mais_vendido,
        cliente_que_mais_agendou: indicadoresResult.rows[0].cliente_que_mais_agendou,
        ticket_medio: indicadoresResult.rows[0].ticket_medio,
        total_clientes: totalClientesResult.rows[0].total_clientes,
        total_barbeiros_ativos: totalBarbeirosAtivosResult.rows[0].total_barbeiros_ativos,
        total_atendimentos_concluidos: indicadoresResult.rows[0].total_atendimentos_concluidos,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao carregar dashboard",
    });
  }
});

module.exports = router;
