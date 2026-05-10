const pool = require("../database/db");
const express = require("express");

const router = express.Router();

// GET /agendamentos -> retorna agendamentos com array de serviços e total
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.cliente_id,
        c.nome AS cliente,
        a.data,
        a.horario,
        COALESCE(json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco)) FILTER (WHERE s.id IS NOT NULL), '[]') AS servicos,
        COALESCE(SUM(s.preco), 0) AS total
      FROM agendamentos a
      INNER JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      GROUP BY a.id, a.cliente_id, c.nome, a.data, a.horario
      ORDER BY a.data ASC
    `);

    res.json(
      result.rows.map((r) => ({
        ...r,
        total: Number(r.total) || 0,
      })),
    );
  } catch (error) {
    console.error("GET /agendamentos failed:", error.message);

    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});

// POST /agendamentos -> cria agendamento com múltiplos serviços
router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, servico_ids = [], data, horario } = req.body;

    if (!Array.isArray(servico_ids) || servico_ids.length === 0) {
      return res.status(400).json({ error: "Selecione pelo menos um serviço" });
    }

    // Verifica horário existente
    const horarioExistente = await client.query(
      `SELECT * FROM agendamentos WHERE data = $1 AND horario = $2`,
      [data, horario],
    );

    if (horarioExistente.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Já existe um agendamento neste horário" });
    }

    await client.query("BEGIN");

    const insertAg = await client.query(
      `INSERT INTO agendamentos (cliente_id, data, horario) VALUES ($1, $2, $3) RETURNING *`,
      [cliente_id, data, horario],
    );

    const agendamentoId = insertAg.rows[0].id;

    for (const servicoId of servico_ids) {
      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES ($1, $2)`,
        [agendamentoId, servicoId],
      );
    }

    await client.query("COMMIT");

    // Retornar o agendamento completo
    const created = await client.query(
      `
      SELECT
        a.id,
        a.cliente_id,
        c.nome AS cliente,
        a.data,
        a.horario,
        COALESCE(json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco)) FILTER (WHERE s.id IS NOT NULL), '[]') AS servicos,
        COALESCE(SUM(s.preco),0) AS total
      FROM agendamentos a
      INNER JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      WHERE a.id = $1
      GROUP BY a.id, a.cliente_id, c.nome, a.data, a.horario
      `,
      [agendamentoId],
    );

    res
      .status(201)
      .json({ ...created.rows[0], total: Number(created.rows[0].total) || 0 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /agendamentos failed:", error.message);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  } finally {
    client.release();
  }
});

// PUT /agendamentos/:id -> editar agendamento e serviços
router.put("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = req.params.id;
    const { cliente_id, servico_ids = [], data, horario } = req.body;

    if (!Array.isArray(servico_ids) || servico_ids.length === 0) {
      return res.status(400).json({ error: "Selecione pelo menos um serviço" });
    }

    const horarioExistente = await client.query(
      `SELECT id FROM agendamentos WHERE data = $1 AND horario = $2 AND id <> $3`,
      [data, horario, id],
    );

    if (horarioExistente.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Já existe um agendamento neste horário" });
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE agendamentos SET cliente_id = $1, data = $2, horario = $3 WHERE id = $4`,
      [cliente_id, data, horario, id],
    );

    // Substitui serviços do agendamento
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
      `
      SELECT
        a.id,
        a.cliente_id,
        c.nome AS cliente,
        a.data,
        a.horario,
        COALESCE(json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco)) FILTER (WHERE s.id IS NOT NULL), '[]') AS servicos,
        COALESCE(SUM(s.preco),0) AS total
      FROM agendamentos a
      INNER JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN agendamento_servicos ags ON a.id = ags.agendamento_id
      LEFT JOIN servicos s ON ags.servico_id = s.id
      WHERE a.id = $1
      GROUP BY a.id, a.cliente_id, c.nome, a.data, a.horario
      `,
      [id],
    );

    res.json({ ...updated.rows[0], total: Number(updated.rows[0].total) || 0 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("PUT /agendamentos/:id failed:", error.message);
    res.status(500).json({ error: "Erro ao atualizar agendamento" });
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
