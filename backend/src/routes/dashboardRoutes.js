const pool = require("../database/db");
const express = require("express");

const router = express.Router();

function buildBillingCte(whereClause = "") {
  return `
    WITH agendamentos_periodo AS (
      SELECT
        a.id,
        a.cliente_id,
        a.status,
        COALESCE(MAX(a.desconto_valor), 0) AS desconto_valor,
        MAX(a.valor_final) AS valor_final,
        COALESCE(SUM(COALESCE(s.preco, 0)), 0) AS total_bruto,
        CASE
          WHEN a.status = 'concluido' THEN
            COALESCE(
              MAX(a.valor_final),
              GREATEST(COALESCE(SUM(COALESCE(s.preco, 0)), 0) - COALESCE(MAX(a.desconto_valor), 0), 0)
            )
          ELSE 0
        END AS valor_faturado
      FROM agendamentos a
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      ${whereClause}
      GROUP BY a.id, a.cliente_id, a.status
    )
  `;
}

router.get("/", async (req, res) => {
  try {
    const mes = req.query.mes;
    const ano = req.query.ano;

    const faturamentoResult = await pool.query(
      `
      ${buildBillingCte(`WHERE EXTRACT(MONTH FROM a.data) = $1 AND EXTRACT(YEAR FROM a.data) = $2`)}
      SELECT
        COALESCE(SUM(valor_faturado), 0) AS faturamento,
        COUNT(*) AS total_agendamentos
      FROM agendamentos_periodo
      `,
      [mes, ano],
    );

    const servicosResult = await pool.query(
      `
      ${buildBillingCte(`WHERE EXTRACT(MONTH FROM a.data) = $1 AND EXTRACT(YEAR FROM a.data) = $2`)}
      SELECT
        s.nome,
        COUNT(*) AS quantidade
      FROM agendamentos_periodo ap
      INNER JOIN agendamento_servicos ags
        ON ap.id = ags.agendamento_id
      INNER JOIN servicos s
        ON ags.servico_id = s.id
      WHERE ap.status = 'concluido'
      GROUP BY s.nome
      ORDER BY quantidade DESC
      `,
      [mes, ano],
    );

    const faturamentoDiaResult = await pool.query(
      `
      ${buildBillingCte(`WHERE a.data::date = CURRENT_DATE`)}
      SELECT COALESCE(SUM(valor_faturado), 0) AS faturamento_dia
      FROM agendamentos_periodo
      `,
    );

    const faturamentoAnoResult = await pool.query(
      `
      ${buildBillingCte(`WHERE EXTRACT(YEAR FROM a.data) = $1`)}
      SELECT COALESCE(SUM(valor_faturado), 0) AS faturamento_ano
      FROM agendamentos_periodo
      `,
      [ano],
    );

    const faturamentoMensalResult = await pool.query(
      `
      WITH meses AS (
        SELECT generate_series(1, 12) AS mes
      ),
      agendamentos_periodo AS (
        SELECT
          a.id,
          EXTRACT(MONTH FROM a.data)::int AS mes,
          a.status,
          COALESCE(MAX(a.desconto_valor), 0) AS desconto_valor,
          MAX(a.valor_final) AS valor_final,
          COALESCE(SUM(COALESCE(s.preco, 0)), 0) AS total_bruto,
          CASE
            WHEN a.status = 'concluido' THEN
              COALESCE(
                MAX(a.valor_final),
                GREATEST(COALESCE(SUM(COALESCE(s.preco, 0)), 0) - COALESCE(MAX(a.desconto_valor), 0), 0)
              )
            ELSE 0
          END AS valor_faturado
        FROM agendamentos a
        LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
        LEFT JOIN servicos s ON ags.servico_id = s.id
        WHERE EXTRACT(YEAR FROM a.data) = $1
        GROUP BY a.id, a.status, EXTRACT(MONTH FROM a.data)
      )
      SELECT
        meses.mes,
        COALESCE(SUM(ap.valor_faturado), 0) AS faturamento
      FROM meses
      LEFT JOIN agendamentos_periodo ap
        ON ap.mes = meses.mes
      GROUP BY meses.mes
      ORDER BY meses.mes
      `,
      [ano],
    );

    const indicadoresResult = await pool.query(
      `
      ${buildBillingCte(`WHERE EXTRACT(MONTH FROM a.data) = $1 AND EXTRACT(YEAR FROM a.data) = $2`)}
      SELECT
        COALESCE((
          SELECT s.nome
          FROM agendamentos_periodo ap
          INNER JOIN agendamento_servicos ags ON ap.id = ags.agendamento_id
          INNER JOIN servicos s ON ags.servico_id = s.id
          WHERE ap.status = 'concluido'
          GROUP BY s.nome
          ORDER BY COUNT(*) DESC, s.nome ASC
          LIMIT 1
        ), '—') AS servico_mais_vendido,
        COALESCE((
          SELECT c.nome
          FROM agendamentos_periodo ap
          INNER JOIN clientes c ON ap.cliente_id = c.id
          WHERE ap.status = 'concluido'
          GROUP BY c.nome
          ORDER BY COUNT(*) DESC, c.nome ASC
          LIMIT 1
        ), '—') AS cliente_que_mais_agendou,
        COALESCE(ROUND(AVG(valor_faturado) FILTER (WHERE status = 'concluido'), 2), 0) AS ticket_medio,
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
