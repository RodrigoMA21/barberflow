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
