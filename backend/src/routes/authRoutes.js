const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../database/db");

const router = express.Router();

const JWT_SECRET = "barberflow_secret_key";

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

module.exports = router;
