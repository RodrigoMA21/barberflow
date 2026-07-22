const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        nome,
        telefone,
        especialidade,
        foto,
        ativo,
        dias_atendimento,
        horario_inicio,
        horario_fim,
        horario_intervalo_inicio,
        horario_intervalo_fim
      FROM barbeiros
      ORDER BY nome ASC
      `,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /barbeiros failed:", error.message);
    res.status(500).json({ error: "Erro ao buscar barbeiros" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      nome,
      telefone,
      especialidade,
      foto,
      ativo = true,
      dias_atendimento = [],
      horario_inicio = null,
      horario_fim = null,
      horario_intervalo_inicio = null,
      horario_intervalo_fim = null,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO barbeiros (
        nome,
        telefone,
        especialidade,
        foto,
        ativo,
        dias_atendimento,
        horario_inicio,
        horario_fim,
        horario_intervalo_inicio,
        horario_intervalo_fim
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, nome, telefone, especialidade, foto, ativo, dias_atendimento, horario_inicio, horario_fim, horario_intervalo_inicio, horario_intervalo_fim
      `,
      [
        nome,
        telefone,
        especialidade,
        foto,
        ativo,
        JSON.stringify(dias_atendimento),
        horario_inicio,
        horario_fim,
        horario_intervalo_inicio,
        horario_intervalo_fim,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /barbeiros failed:", error.message);
    res.status(500).json({ error: "Erro ao cadastrar barbeiro" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const {
      nome,
      telefone,
      especialidade,
      foto,
      ativo = true,
      dias_atendimento = [],
      horario_inicio = null,
      horario_fim = null,
      horario_intervalo_inicio = null,
      horario_intervalo_fim = null,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE barbeiros
      SET nome = $1,
          telefone = $2,
          especialidade = $3,
          foto = $4,
          ativo = $5,
          dias_atendimento = $6,
          horario_inicio = $7,
          horario_fim = $8,
          horario_intervalo_inicio = $9,
          horario_intervalo_fim = $10
      WHERE id = $11
      RETURNING id, nome, telefone, especialidade, foto, ativo, dias_atendimento, horario_inicio, horario_fim, horario_intervalo_inicio, horario_intervalo_fim
      `,
      [
        nome,
        telefone,
        especialidade,
        foto,
        ativo,
        JSON.stringify(dias_atendimento),
        horario_inicio,
        horario_fim,
        horario_intervalo_inicio,
        horario_intervalo_fim,
        id,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /barbeiros/:id failed:", error.message);
    res.status(500).json({ error: "Erro ao atualizar barbeiro" });
  }
});

router.get("/:id/stats", async (req, res) => {
  try {
    const id = req.params.id;
    const numericId = Number(id);

    if (!numericId) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const clientesResult = await pool.query(
      `
      SELECT c.nome, COUNT(*) AS total
      FROM agendamentos a
      INNER JOIN clientes c ON a.cliente_id = c.id
      WHERE a.barbeiro_id = $1 AND a.status = 'concluido'
      GROUP BY c.nome
      ORDER BY total DESC
      LIMIT 5
      `,
      [numericId],
    );

    const diasResult = await pool.query(
      `
      SELECT EXTRACT(DOW FROM a.data)::int AS dia_semana, COUNT(*) AS total
      FROM agendamentos a
      WHERE a.barbeiro_id = $1 AND a.status = 'concluido'
      GROUP BY dia_semana
      ORDER BY total DESC
      `,
      [numericId],
    );

    const totaisResult = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'concluido')::int AS total_concluidos,
        COUNT(*)::int AS total_agendamentos
      FROM agendamentos
      WHERE barbeiro_id = $1
      `,
      [numericId],
    );

    const diasMap = { 0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado" };
    const dias = diasResult.rows.map((r) => ({ dia: diasMap[r.dia_semana] || "Desconhecido", total: Number(r.total) }));

    res.json({
      clientes: clientesResult.rows.map((r) => ({ nome: r.nome, total: Number(r.total) })),
      dias,
      totais: {
        concluidos: Number(totaisResult.rows[0].total_concluidos),
        total: Number(totaisResult.rows[0].total_agendamentos),
      },
    });
  } catch (error) {
    console.error("GET /barbeiros/:id/stats failed:", error.message);
    res.status(500).json({ error: "Erro ao carregar estatísticas do barbeiro" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM barbeiros WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("DELETE /barbeiros/:id failed:", error.message);
    res.status(500).json({ error: "Erro ao deletar barbeiro" });
  }
});

module.exports = router;
