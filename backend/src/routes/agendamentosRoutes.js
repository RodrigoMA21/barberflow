const pool = require("../database/db");
const express = require("express");

const {
  calculateAppointmentEnd,
  calculateTotalDuration,
  formatMinutesAsTime,
  overlaps,
  parseLocalDateTime,
  validateBusinessHours,
} = require("../services/agendaRules");

const router = express.Router();

const ALLOWED_STATUS = [
  "agendado",
  "confirmado",
  "concluido",
  "cancelado",
  "nao_compareceu",
];

function normalizeStatus(status) {
  const value = String(status || "agendado").toLowerCase();
  return ALLOWED_STATUS.includes(value) ? value : null;
}

function mapAgendamento(row) {
  return {
    ...row,
    total: Number(row.total) || 0,
    duracao_total_minutos: Number(row.duracao_total_minutos) || 0,
    barbeiro_id: row.barbeiro_id ? Number(row.barbeiro_id) : null,
  };
}

async function buscarDetalhesServicos(client, servicoIds) {
  const result = await client.query(
    `
    SELECT id, nome, preco, COALESCE(duracao_minutos, 30) AS duracao_minutos
    FROM servicos
    WHERE id = ANY($1::int[])
    ORDER BY id ASC
    `,
    [servicoIds],
  );

  return result.rows;
}

async function buscarConflitos(client, { barbeiroId, data, ignoreId = null }) {
  const params = [barbeiroId, data];
  let ignoreClause = "";

  if (ignoreId) {
    params.push(ignoreId);
    ignoreClause = `AND a.id <> $3`;
  }

  const result = await client.query(
    `
    SELECT
      a.id,
      a.data,
      a.horario,
      a.status,
      COALESCE(SUM(COALESCE(s.duracao_minutos, 30)), 0) AS duracao_total_minutos
    FROM agendamentos a
    LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
    LEFT JOIN servicos s ON ags.servico_id = s.id
    WHERE a.barbeiro_id = $1
      AND a.data = $2
      AND a.status <> 'cancelado'
      ${ignoreClause}
    GROUP BY a.id, a.data, a.horario, a.status
    ORDER BY a.horario ASC
    `,
    params,
  );

  return result.rows;
}

function buildAgendamentoSelect(whereClause = "", orderClause = "ORDER BY a.data ASC, a.horario ASC") {
  return `
    SELECT
      a.id,
      a.cliente_id,
      c.nome AS cliente,
      a.barbeiro_id,
      b.nome AS barbeiro,
      b.especialidade AS barbeiro_especialidade,
      a.data,
      a.horario,
      a.status,
      (a.data + a.horario) AS inicio_em,
      ((a.data + a.horario) + make_interval(mins => COALESCE(SUM(COALESCE(s.duracao_minutos, 30)), 0)::int)) AS termino_em,
      COALESCE(SUM(COALESCE(s.duracao_minutos, 30)), 0)::int AS duracao_total_minutos,
      COALESCE(json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco, 'duracao_minutos', COALESCE(s.duracao_minutos, 30))) FILTER (WHERE s.id IS NOT NULL), '[]') AS servicos,
      COALESCE(SUM(s.preco), 0) AS total
    FROM agendamentos a
    INNER JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN barbeiros b ON a.barbeiro_id = b.id
    LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
    LEFT JOIN servicos s ON ags.servico_id = s.id
    ${whereClause}
    GROUP BY a.id, a.cliente_id, c.nome, a.barbeiro_id, b.nome, b.especialidade, a.data, a.horario, a.status
    ${orderClause}
  `;
}

router.get("/historico", async (req, res) => {
  try {
    const { month, year, cliente_id } = req.query;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
    const offset = (page - 1) * limit;

    const params = [];
    let where = `WHERE (a.data + a.horario) < now()`;

    if (month) {
      params.push(month);
      where += ` AND EXTRACT(MONTH FROM a.data) = $${params.length}`;
    }

    if (year) {
      params.push(year);
      where += ` AND EXTRACT(YEAR FROM a.data) = $${params.length}`;
    }

    if (cliente_id) {
      params.push(cliente_id);
      where += ` AND a.cliente_id = $${params.length}`;
    }

    const countResult = await pool.query(
      `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM agendamentos a
      INNER JOIN clientes c ON a.cliente_id = c.id
      ${where}
      `,
      params,
    );

    const listParams = [...params, limit, offset];
    const result = await pool.query(
      `${buildAgendamentoSelect(where, `ORDER BY a.data DESC, a.horario DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`)}`,
      listParams,
    );

    res.json({
      data: result.rows.map(mapAgendamento),
      meta: {
        page,
        limit,
        total: Number(countResult.rows[0].total) || 0,
      },
    });
  } catch (error) {
    console.error("GET /agendamentos/historico failed:", error.message);
    res.status(500).json({ error: "Erro ao buscar histórico de agendamentos" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { data, barbeiro_id, status } = req.query;
    const params = [];
    const whereParts = [];

    if (data) {
      params.push(data);
      whereParts.push(`a.data = $${params.length}`);
    }

    if (barbeiro_id) {
      params.push(barbeiro_id);
      whereParts.push(`a.barbeiro_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereParts.push(`a.status = $${params.length}`);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const result = await pool.query(buildAgendamentoSelect(whereClause, "ORDER BY a.data ASC, a.horario ASC"), params);

    res.json(result.rows.map(mapAgendamento));
  } catch (error) {
    console.error("GET /agendamentos failed:", error.message);
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});

router.get("/agenda", async (req, res) => {
  try {
    const { data, barbeiro_id } = req.query;
    if (!data) {
      return res.status(400).json({ error: "Informe a data da agenda" });
    }

    const params = [data];
    const whereParts = [`a.data = $1`];

    if (barbeiro_id) {
      params.push(barbeiro_id);
      whereParts.push(`a.barbeiro_id = $${params.length}`);
    }

    const result = await pool.query(
      buildAgendamentoSelect(
        `WHERE ${whereParts.join(" AND ")}`,
        "ORDER BY a.horario ASC",
      ),
      params,
    );

    res.json(result.rows.map(mapAgendamento));
  } catch (error) {
    console.error("GET /agendamentos/agenda failed:", error.message);
    res.status(500).json({ error: "Erro ao carregar agenda" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, barbeiro_id, servico_ids = [], data, horario, status = "agendado" } = req.body;
    const normalizedStatus = normalizeStatus(status);

    if (!cliente_id) {
      return res.status(400).json({ error: "Selecione um cliente" });
    }

    if (!barbeiro_id) {
      return res.status(400).json({ error: "Selecione um barbeiro" });
    }

    if (!Array.isArray(servico_ids) || servico_ids.length === 0) {
      return res.status(400).json({ error: "Selecione pelo menos um serviço" });
    }

    if (!normalizedStatus) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const dataHoraInicio = parseLocalDateTime(data, horario);

    if (!dataHoraInicio) {
      return res.status(400).json({ error: "Data ou horário inválido" });
    }

    await client.query("BEGIN");

    const servicosDetalhados = await buscarDetalhesServicos(client, servico_ids.map((id) => Number(id)));

    if (servicosDetalhados.length !== servico_ids.length) {
      throw new Error("Um ou mais serviços selecionados não foram encontrados");
    }

    const duracaoTotal = calculateTotalDuration(servicosDetalhados);
    const dataHoraFim = calculateAppointmentEnd(dataHoraInicio, duracaoTotal);

    const businessValidation = validateBusinessHours(dataHoraInicio, dataHoraFim);

    if (!businessValidation.ok) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: businessValidation.error });
    }

    const conflitos = await buscarConflitos(client, {
      barbeiroId: Number(barbeiro_id),
      data,
    });

    for (const conflito of conflitos) {
      const conflitoInicio = parseLocalDateTime(conflito.data, conflito.horario);
      if (!conflitoInicio) {
        continue;
      }

      const conflitoFim = calculateAppointmentEnd(
        conflitoInicio,
        Number(conflito.duracao_total_minutos) || 0,
      );

      if (
        conflitoInicio &&
        conflitoFim &&
        overlaps(dataHoraInicio, dataHoraFim, conflitoInicio, conflitoFim)
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Conflito de horário para o barbeiro selecionado. O atendimento termina às ${formatMinutesAsTime(
            dataHoraInicio.getHours() * 60 + dataHoraInicio.getMinutes() + duracaoTotal,
          )}.`,
        });
      }
    }

    const insertAg = await client.query(
      `
      INSERT INTO agendamentos (cliente_id, barbeiro_id, data, horario, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [cliente_id, barbeiro_id, data, horario, normalizedStatus],
    );

    const agendamentoId = insertAg.rows[0].id;

    for (const servicoId of servico_ids) {
      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES ($1, $2)`,
        [agendamentoId, servicoId],
      );
    }

    await client.query("COMMIT");

    const created = await client.query(
      `${buildAgendamentoSelect("WHERE a.id = $1", "")}`,
      [agendamentoId],
    );

    res.status(201).json(mapAgendamento(created.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /agendamentos failed:", error.message);
    res.status(500).json({ error: error.message || "Erro ao criar agendamento" });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = req.params.id;
    const { cliente_id, barbeiro_id, servico_ids = [], data, horario, status = "agendado" } = req.body;
    const normalizedStatus = normalizeStatus(status);

    if (!cliente_id) {
      return res.status(400).json({ error: "Selecione um cliente" });
    }

    if (!barbeiro_id) {
      return res.status(400).json({ error: "Selecione um barbeiro" });
    }

    if (!Array.isArray(servico_ids) || servico_ids.length === 0) {
      return res.status(400).json({ error: "Selecione pelo menos um serviço" });
    }

    if (!normalizedStatus) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const dataHoraInicio = parseLocalDateTime(data, horario);

    if (!dataHoraInicio) {
      return res.status(400).json({ error: "Data ou horário inválido" });
    }

    await client.query("BEGIN");

    const servicosDetalhados = await buscarDetalhesServicos(client, servico_ids.map((item) => Number(item)));

    if (servicosDetalhados.length !== servico_ids.length) {
      throw new Error("Um ou mais serviços selecionados não foram encontrados");
    }

    const duracaoTotal = calculateTotalDuration(servicosDetalhados);
    const dataHoraFim = calculateAppointmentEnd(dataHoraInicio, duracaoTotal);

    const businessValidation = validateBusinessHours(dataHoraInicio, dataHoraFim);

    if (!businessValidation.ok) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: businessValidation.error });
    }

    const conflitos = await buscarConflitos(client, {
      barbeiroId: Number(barbeiro_id),
      data,
      ignoreId: id,
    });

    for (const conflito of conflitos) {
      const conflitoInicio = parseLocalDateTime(conflito.data, conflito.horario);
      if (!conflitoInicio) {
        continue;
      }

      const conflitoFim = calculateAppointmentEnd(
        conflitoInicio,
        Number(conflito.duracao_total_minutos) || 0,
      );

      if (
        conflitoInicio &&
        conflitoFim &&
        overlaps(dataHoraInicio, dataHoraFim, conflitoInicio, conflitoFim)
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Conflito de horário para o barbeiro selecionado",
        });
      }
    }

    await client.query(
      `
      UPDATE agendamentos
      SET cliente_id = $1, barbeiro_id = $2, data = $3, horario = $4, status = $5
      WHERE id = $6
      `,
      [cliente_id, barbeiro_id, data, horario, normalizedStatus, id],
    );

    await client.query(
      `DELETE FROM agendamento_servicos WHERE agendamento_id = $1`,
      [id],
    );

    for (const servicoId of servico_ids) {
      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES ($1, $2)`,
        [id, servicoId],
      );
    }

    await client.query("COMMIT");

    const updated = await client.query(
      `${buildAgendamentoSelect("WHERE a.id = $1", "")}`,
      [id],
    );

    res.json(mapAgendamento(updated.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("PUT /agendamentos/:id failed:", error.message);
    res.status(500).json({ error: error.message || "Erro ao atualizar agendamento" });
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM agendamentos WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: "Erro ao deletar agendamento" });
  }
});

module.exports = router;
