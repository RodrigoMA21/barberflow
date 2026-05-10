const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clientes ORDER BY id ASC");

    res.json(result.rows);
  } catch (error) {
    console.error("GET /clientes failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    const payload = {
      error: "Erro ao buscar clientes",
    };

    if (process.env.NODE_ENV !== "production") {
      payload.details = error.message;
      payload.code = error.code;
    }

    res.status(500).json(payload);
  }
});

router.post("/", async (req, res) => {
  try {
    const { nome, telefone } = req.body;

    const result = await pool.query(
      "INSERT INTO clientes (nome, telefone) VALUES ($1, $2) RETURNING *",
      [nome, telefone],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao cadastrar cliente",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM clientes WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao deletar cliente",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const { nome, telefone } = req.body;

    const result = await pool.query(
      `UPDATE clientes
       SET nome = $1, telefone = $2
       WHERE id = $3
       RETURNING *`,
      [nome, telefone, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar cliente",
    });
  }
});

module.exports = router;
