const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../database/db");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({
        error: "Usuário não encontrado",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        error: "Senha inválida",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao fazer login",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: "Preencha nome, email e senha",
      });
    }

    const usuarioExistente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        error: "Já existe um usuário com esse email",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email`,
      [nome, email, senhaHash]
    );

    const usuario = result.rows[0];

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(201).json({
      token,
      usuario,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao criar conta",
    });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { nome } = req.body;
    const userId = req.user.id;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const result = await pool.query(
      `UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING id, nome, email`,
      [nome.trim(), userId]
    );

    res.json({ usuario: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

router.get("/settings", authenticateToken, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL
      )
    `);
    const result = await pool.query(`SELECT value FROM config WHERE key = 'business_hours'`);
    const defaults = { start_hour: "08:00", end_hour: "19:00", break_start: "12:00", break_end: "13:00", days: [1, 2, 3, 4, 5, 6] };
    res.json(result.rows.length ? result.rows[0].value : defaults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar configurações" });
  }
});

router.put("/settings", authenticateToken, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL
      )
    `);
    const { start_hour, end_hour, break_start, break_end, days } = req.body;
    const value = JSON.stringify({ start_hour, end_hour, break_start, break_end, days });
    await pool.query(
      `INSERT INTO config (key, value) VALUES ('business_hours', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
      [value]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar configurações" });
  }
});

module.exports = router;
