const express = require("express");

const router = express.Router();

let clientes = [];

router.get("/", (req, res) => {
  res.json(clientes);
});

router.post("/", (req, res) => {
  const novoCliente = {
    id: clientes.length + 1,
    nome: req.body.nome,
    telefone: req.body.telefone,
  };

  clientes.push(novoCliente);

  res.status(201).json(novoCliente);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  clientes = clientes.filter((cliente) => cliente.id !== id);

  res.status(204).send();
});
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);

  const clienteIndex = clientes.findIndex((cliente) => cliente.id === id);

  if (clienteIndex === -1) {
    return res.status(404).json({ message: "Cliente não encontrado" });
  }

  clientes[clienteIndex] = {
    id,
    nome: req.body.nome,
    telefone: req.body.telefone,
  };

  res.json(clientes[clienteIndex]);
});

module.exports = router;
