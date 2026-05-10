const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM servicos ORDER BY id ASC");

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
    const { nome, preco } = req.body;

    const result = await pool.query(
      "INSERT INTO servicos (nome, preco) VALUES ($1, $2) RETURNING *",
      [nome, preco],
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

    const { nome, preco } = req.body;

    const result = await pool.query(
      `UPDATE servicos
       SET nome = $1, preco = $2
       WHERE id = $3
       RETURNING *`,
      [nome, preco, id],
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
