const pool = require("../database/db");
const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        agendamentos.id,

        clientes.nome AS cliente,
        servicos.nome AS servico,
        servicos.preco,

        agendamentos.data,
        agendamentos.horario

      FROM agendamentos

      INNER JOIN clientes
        ON agendamentos.cliente_id = clientes.id

      INNER JOIN servicos
        ON agendamentos.servico_id = servicos.id

      ORDER BY agendamentos.data ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar agendamentos",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { cliente_id, servico_id, data, horario } = req.body;

    const result = await pool.query(
      `INSERT INTO agendamentos
       (cliente_id, servico_id, data, horario)

       VALUES ($1, $2, $3, $4)

       RETURNING *`,
      [cliente_id, servico_id, data, horario],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao criar agendamento",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM agendamentos WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao deletar agendamento",
    });
  }
});

module.exports = router;
