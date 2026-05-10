import { useEffect, useState } from "react";

function Servicos() {
  const [servicos, setServicos] = useState([]);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  const [editandoId, setEditandoId] = useState(null);

  async function carregarServicos() {
    const response = await fetch("http://localhost:3000/servicos");

    const data = await response.json();

    setServicos(data);
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  async function cadastrarServico(e) {
    e.preventDefault();

    const novoServico = {
      nome,
      preco,
    };

    await fetch("http://localhost:3000/servicos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novoServico),
    });

    setNome("");
    setPreco("");

    carregarServicos();
  }

  async function deletarServico(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja deletar este serviço?",
    );

    if (!confirmar) {
      return;
    }

    await fetch(`http://localhost:3000/servicos/${id}`, {
      method: "DELETE",
    });

    carregarServicos();
  }

  function iniciarEdicao(servico) {
    setEditandoId(servico.id);

    setNome(servico.nome);

    setPreco(servico.preco);
  }

  async function salvarEdicao(e) {
    e.preventDefault();

    const servicoAtualizado = {
      nome,
      preco,
    };

    await fetch(`http://localhost:3000/servicos/${editandoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(servicoAtualizado),
    });

    setEditandoId(null);

    setNome("");
    setPreco("");

    carregarServicos();
  }

  return (
    <div>
      <form
        onSubmit={editandoId ? salvarEdicao : cadastrarServico}
        className="bg-white p-6 rounded shadow mb-6"
      >
        <div className="mb-4">
          <label className="block mb-1">Nome</label>

          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Preço</label>

          <input
            type="number"
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {editandoId ? "Salvar Edição" : "Cadastrar"}
        </button>
      </form>

      <div className="space-y-4">
        {servicos.map((servico) => (
          <div key={servico.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{servico.nome}</h2>

            <p>R$ {servico.preco}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => iniciarEdicao(servico)}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Editar
              </button>

              <button
                onClick={() => deletarServico(servico.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Servicos;
