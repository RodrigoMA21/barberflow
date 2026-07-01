const pool = require("../database/db");
const express = require("express");

const router = express.Router();

function mapCliente(row) {
  const cartaoFidelidadeCarimbos = Number(row.cartao_fidelidade_carimbos) || 0;

  return {
    ...row,
    email: row.email || "",
    cpf: row.cpf || "",
    cartao_fidelidade_ativo: Boolean(row.cartao_fidelidade_ativo) || cartaoFidelidadeCarimbos > 0,
    cartao_fidelidade_carimbos: cartaoFidelidadeCarimbos,
    cartao_fidelidade_meta: Number(row.cartao_fidelidade_meta) || 10,
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.nome,
        c.telefone,
        c.email,
        c.cpf,
        c.created_at,
        c.cartao_fidelidade_ativo,
        COALESCE(COUNT(r.id), 0)::int AS cartao_fidelidade_carimbos,
        c.cartao_fidelidade_meta
      FROM clientes c
      LEFT JOIN cartao_fidelidade_registros r
        ON r.cliente_id = c.id
      GROUP BY c.id, c.nome, c.telefone, c.email, c.cpf, c.created_at, c.cartao_fidelidade_ativo, c.cartao_fidelidade_meta
      ORDER BY c.id ASC
      `,
    );

    res.json(result.rows.map(mapCliente));
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
    const {
      nome,
      telefone,
      email,
      cpf,
      cartao_fidelidade_ativo = false,
      cartao_fidelidade_carimbos = 0,
      cartao_fidelidade_meta = 10,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO clientes (
        nome,
        telefone,
        email,
        cpf,
        cartao_fidelidade_ativo,
        cartao_fidelidade_carimbos,
        cartao_fidelidade_meta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        nome,
        telefone,
        email,
        cpf,
        created_at,
        cartao_fidelidade_ativo,
        cartao_fidelidade_carimbos,
        cartao_fidelidade_meta
      `,
      [nome, telefone, email || null, cpf || null, cartao_fidelidade_ativo, cartao_fidelidade_carimbos, cartao_fidelidade_meta],
    );

    res.status(201).json(mapCliente(result.rows[0]));
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

    const {
      nome,
      telefone,
      email,
      cpf,
      cartao_fidelidade_ativo = false,
      cartao_fidelidade_carimbos = 0,
      cartao_fidelidade_meta = 10,
    } = req.body;

    const result = await pool.query(
      `UPDATE clientes
       SET nome = $1,
           telefone = $2,
           email = $3,
           cpf = $4,
           cartao_fidelidade_ativo = $5,
           cartao_fidelidade_carimbos = $6,
           cartao_fidelidade_meta = $7
       WHERE id = $8
       RETURNING
         id,
         nome,
         telefone,
         email,
         cpf,
         created_at,
         cartao_fidelidade_ativo,
         cartao_fidelidade_carimbos,
         cartao_fidelidade_meta`,
      [nome, telefone, email || null, cpf || null, cartao_fidelidade_ativo, cartao_fidelidade_carimbos, cartao_fidelidade_meta, id],
    );

    res.json(mapCliente(result.rows[0]));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao atualizar cliente",
    });
  }
});

router.get("/:id/cartao-fidelidade", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      `
      SELECT
        id,
        cliente_id,
        data_atendimento,
        observacao,
        created_at
      FROM cartao_fidelidade_registros
      WHERE cliente_id = $1
      ORDER BY data_atendimento DESC, id DESC
      `,
      [id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /clientes/:id/cartao-fidelidade failed:", error.message);
    res.status(500).json({ error: "Erro ao buscar cartão fidelidade" });
  }
});

router.post("/:id/cartao-fidelidade", async (req, res) => {
  try {
    const id = req.params.id;
    const { data_atendimento, observacao } = req.body;

    if (!data_atendimento) {
      return res.status(400).json({ error: "Informe a data do atendimento" });
    }

    const result = await pool.query(
      `
      INSERT INTO cartao_fidelidade_registros (cliente_id, data_atendimento, observacao)
      VALUES ($1, $2, $3)
      RETURNING id, cliente_id, data_atendimento, observacao, created_at
      `,
      [id, data_atendimento, observacao || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /clientes/:id/cartao-fidelidade failed:", error.message);
    res.status(500).json({ error: "Erro ao registrar atendimento no cartão fidelidade" });
  }
});

router.delete("/:id/cartao-fidelidade", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM cartao_fidelidade_registros WHERE cliente_id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("DELETE /clientes/:id/cartao-fidelidade failed:", error.message);
    res.status(500).json({ error: "Erro ao limpar cartão fidelidade" });
  }
});

module.exports = router;
