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
        ativo
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
    const { nome, telefone, especialidade, foto, ativo = true } = req.body;

    const result = await pool.query(
      `
      INSERT INTO barbeiros (nome, telefone, especialidade, foto, ativo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, telefone, especialidade, foto, ativo
      `,
      [nome, telefone, especialidade, foto, ativo],
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
    const { nome, telefone, especialidade, foto, ativo = true } = req.body;

    const result = await pool.query(
      `
      UPDATE barbeiros
      SET nome = $1, telefone = $2, especialidade = $3, foto = $4, ativo = $5
      WHERE id = $6
      RETURNING id, nome, telefone, especialidade, foto, ativo
      `,
      [nome, telefone, especialidade, foto, ativo, id],
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
