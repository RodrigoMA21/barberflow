const pool = require("../database/db");
const express = require("express");

const router = express.Router();

function mapCliente(row) {
  const cartaoFidelidadeCarimbos = Number(row.cartao_fidelidade_carimbos) || 0;

  return {
    ...row,
    email: row.email || "",
    cpf: row.cpf || "",
    endereco: row.endereco || "",
    cartao_fidelidade_ativo: Boolean(row.cartao_fidelidade_ativo),
    cartao_fidelidade_auto: Boolean(row.cartao_fidelidade_auto),
    cartao_fidelidade_carimbos: cartaoFidelidadeCarimbos,
    cartao_fidelidade_meta: Number(row.cartao_fidelidade_meta) || 10,
    cartao_fidelidade_usados: Number(row.cartao_fidelidade_usados) || 0,
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
        c.endereco,
        c.created_at,
        c.cartao_fidelidade_ativo,
        c.cartao_fidelidade_auto,
        c.cartao_fidelidade_carimbos,
        c.cartao_fidelidade_meta,
        COALESCE(c.cartao_fidelidade_usados, 0) AS cartao_fidelidade_usados
      FROM clientes c
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
      endereco,
      cartao_fidelidade_ativo = false,
      cartao_fidelidade_auto = true,
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
        endereco,
        cartao_fidelidade_ativo,
        cartao_fidelidade_auto,
        cartao_fidelidade_carimbos,
        cartao_fidelidade_meta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        nome,
        telefone,
        email,
        cpf,
        endereco,
        created_at,
        cartao_fidelidade_ativo,
        cartao_fidelidade_auto,
        cartao_fidelidade_carimbos,
        cartao_fidelidade_meta,
        cartao_fidelidade_usados
      `,
      [nome, telefone || null, email || null, cpf || null, endereco || null, cartao_fidelidade_ativo, cartao_fidelidade_auto, cartao_fidelidade_carimbos, cartao_fidelidade_meta],
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
      endereco,
      cartao_fidelidade_ativo = false,
      cartao_fidelidade_auto = true,
      cartao_fidelidade_carimbos = 0,
      cartao_fidelidade_meta = 10,
    } = req.body;

    const result = await pool.query(
      `UPDATE clientes
       SET nome = $1,
           telefone = $2,
           email = $3,
           cpf = $4,
           endereco = $5,
           cartao_fidelidade_ativo = $6,
           cartao_fidelidade_auto = $7,
           cartao_fidelidade_carimbos = $8,
           cartao_fidelidade_meta = $9
       WHERE id = $10
       RETURNING
         id,
         nome,
         telefone,
         email,
         cpf,
         endereco,
         created_at,
         cartao_fidelidade_ativo,
         cartao_fidelidade_auto,
         cartao_fidelidade_carimbos,
         cartao_fidelidade_meta,
         cartao_fidelidade_usados`,
      [nome, telefone || null, email || null, cpf || null, endereco || null, cartao_fidelidade_ativo, cartao_fidelidade_auto, cartao_fidelidade_carimbos, cartao_fidelidade_meta, id],
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
      SELECT DISTINCT ON (data_atendimento)
        id,
        cliente_id,
        data_atendimento,
        observacao,
        created_at
      FROM cartao_fidelidade_registros
      WHERE cliente_id = $1
      ORDER BY data_atendimento DESC, id ASC
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
    const { data_atendimento, observacao, auto } = req.body;

    if (!data_atendimento) {
      return res.status(400).json({ error: "Informe a data do atendimento" });
    }

    if (auto) {
      const cliente = await pool.query(
        `SELECT cartao_fidelidade_auto FROM clientes WHERE id = $1`,
        [id],
      );
      if (!cliente.rows[0]?.cartao_fidelidade_auto) {
        return res.json({ skipped: true });
      }
    }

    const existing = await pool.query(
      `SELECT id FROM cartao_fidelidade_registros
       WHERE cliente_id = $1 AND data_atendimento = $2`,
      [id, data_atendimento],
    );

    if (existing.rows.length > 0) {
      return res.status(200).json(existing.rows[0]);
    }

    const result = await pool.query(
      `
      INSERT INTO cartao_fidelidade_registros (cliente_id, data_atendimento, observacao)
      VALUES ($1, $2, $3)
      RETURNING id, cliente_id, data_atendimento, observacao, created_at
      `,
      [id, data_atendimento, observacao || null],
    );

    await pool.query(
      `UPDATE clientes SET cartao_fidelidade_carimbos = cartao_fidelidade_carimbos + 1 WHERE id = $1`,
      [id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /clientes/:id/cartao-fidelidade failed:", error.message);
    res.status(500).json({ error: "Erro ao registrar atendimento no cartão fidelidade" });
  }
});

router.post("/:id/cartao-fidelidade/usar", async (req, res) => {
  try {
    const id = req.params.id;

    const atual = await pool.query(
      `SELECT cartao_fidelidade_carimbos, cartao_fidelidade_meta FROM clientes WHERE id = $1`,
      [id],
    );

    const carimbos = Number(atual.rows[0]?.cartao_fidelidade_carimbos) || 0;
    const meta = Number(atual.rows[0]?.cartao_fidelidade_meta) || 10;
    const saldo = Math.max(0, carimbos - meta);

    const result = await pool.query(
      `UPDATE clientes
       SET cartao_fidelidade_carimbos = $1,
           cartao_fidelidade_usados = COALESCE(cartao_fidelidade_usados, 0) + 1
       WHERE id = $2
       RETURNING
         id,
         cartao_fidelidade_carimbos,
         cartao_fidelidade_meta,
         cartao_fidelidade_usados`,
      [saldo, id],
    );

    await pool.query("DELETE FROM cartao_fidelidade_registros WHERE cliente_id = $1", [id]);

    if (saldo > 0) {
      const dataHoje = new Date().toISOString().split("T")[0];
      await pool.query(
        `INSERT INTO cartao_fidelidade_registros (cliente_id, data_atendimento, observacao) VALUES ($1, $2, $3)`,
        [id, dataHoje, "Saldo do cartão anterior"],
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("POST /clientes/:id/cartao-fidelidade/usar failed:", error.message);
    res.status(500).json({ error: "Erro ao usar cartão fidelidade" });
  }
});

router.delete("/:id/cartao-fidelidade/registro/:registroId", async (req, res) => {
  try {
    const { id, registroId } = req.params;

    const result = await pool.query(
      `DELETE FROM cartao_fidelidade_registros WHERE id = $1 AND cliente_id = $2 RETURNING id`,
      [registroId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    await pool.query(
      `UPDATE clientes SET cartao_fidelidade_carimbos = GREATEST(cartao_fidelidade_carimbos - 1, 0) WHERE id = $1`,
      [id],
    );

    res.status(204).send();
  } catch (error) {
    console.error("DELETE /clientes/:id/cartao-fidelidade/registro/:registroId failed:", error.message);
    res.status(500).json({ error: "Erro ao remover registro" });
  }
});

router.delete("/:id/cartao-fidelidade", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query("DELETE FROM cartao_fidelidade_registros WHERE cliente_id = $1", [id]);

    await pool.query("UPDATE clientes SET cartao_fidelidade_carimbos = 0 WHERE id = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("DELETE /clientes/:id/cartao-fidelidade failed:", error.message);
    res.status(500).json({ error: "Erro ao limpar cartão fidelidade" });
  }
});

module.exports = router;
