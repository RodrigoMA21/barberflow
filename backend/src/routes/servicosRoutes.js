const pool = require("../database/db");
const express = require("express");

const router = express.Router();

pool.query(`ALTER TABLE servicos ADD COLUMN IF NOT EXISTS descricao TEXT DEFAULT ''`).catch(() => {});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, descricao, preco, COALESCE(duracao_minutos, 30) AS duracao_minutos FROM servicos ORDER BY id ASC`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar serviços",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nome, preco, duracao_minutos = 30, descricao = "" } = req.body;

    const result = await pool.query(
      `INSERT INTO servicos (nome, preco, duracao_minutos, descricao) VALUES ($1, $2, $3, $4) RETURNING id, nome, descricao, preco, COALESCE(duracao_minutos, 30) AS duracao_minutos`,
      [nome, preco, duracao_minutos, descricao],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao cadastrar serviço",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const { nome, preco, duracao_minutos = 30, descricao = "" } = req.body;

    const result = await pool.query(
      `UPDATE servicos SET nome = $1, preco = $2, duracao_minutos = $3, descricao = $4 WHERE id = $5 RETURNING id, nome, descricao, preco, COALESCE(duracao_minutos, 30) AS duracao_minutos`,
      [nome, preco, duracao_minutos, descricao, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar serviço",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM servicos WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao deletar serviço",
    });
  }
});

module.exports = router;
