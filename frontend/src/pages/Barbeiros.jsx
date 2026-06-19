import { useEffect, useState } from "react";

function Barbeiros() {
  const [barbeiros, setBarbeiros] = useState([]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [foto, setFoto] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [barbeiroEditando, setBarbeiroEditando] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [barbeiroParaDeletar, setBarbeiroParaDeletar] = useState(null);

  async function carregarBarbeiros() {
    const response = await fetch("http://localhost:3000/barbeiros");
    const data = await response.json();
    setBarbeiros(data);
  }

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  async function cadastrarBarbeiro(e) {
    e.preventDefault();

    const barbeiroData = {
      nome,
      telefone,
      especialidade,
      foto,
      ativo,
    };

    if (barbeiroEditando) {
      await fetch(`http://localhost:3000/barbeiros/${barbeiroEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(barbeiroData),
      });

      setBarbeiroEditando(null);
    } else {
      await fetch("http://localhost:3000/barbeiros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(barbeiroData),
      });
    }

    setNome("");
    setTelefone("");
    setEspecialidade("");
    setFoto("");
    setAtivo(true);

    carregarBarbeiros();
  }

  async function deletarBarbeiro(id) {
    await fetch(`http://localhost:3000/barbeiros/${id}`, {
      method: "DELETE",
    });

    carregarBarbeiros();
  }

  function pedirConfirmacaoDeletar(barbeiro) {
    setBarbeiroParaDeletar(barbeiro);
    setShowConfirm(true);
  }

  async function confirmarDeletar() {
    if (!barbeiroParaDeletar) return;

    await deletarBarbeiro(barbeiroParaDeletar.id);

    setShowConfirm(false);
    setBarbeiroParaDeletar(null);
  }

  function cancelarDeletar() {
    setShowConfirm(false);
    setBarbeiroParaDeletar(null);
  }

  function editarBarbeiro(barbeiro) {
    setBarbeiroEditando(barbeiro);
    setNome(barbeiro.nome);
    setTelefone(barbeiro.telefone || "");
    setEspecialidade(barbeiro.especialidade || "");
    setFoto(barbeiro.foto || "");
    setAtivo(Boolean(barbeiro.ativo));
  }

  return (
    <div>
      <form onSubmit={cadastrarBarbeiro} className="bg-white p-6 rounded shadow mb-6">
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
          <label className="block mb-1">Telefone</label>
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Especialidade</label>
          <input
            type="text"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Foto (URL)</label>
          <input
            type="url"
            value={foto}
            onChange={(e) => setFoto(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="w-4 h-4"
          />
          <label>Ativo</label>
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {barbeiroEditando ? "Atualizar" : "Cadastrar"}
        </button>
      </form>

      <div className="space-y-4">
        {barbeiros.map((barbeiro) => (
          <div key={barbeiro.id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
            {barbeiro.foto ? (
              <img
                src={barbeiro.foto}
                alt={barbeiro.nome}
                className="w-20 h-20 rounded object-cover bg-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                Sem foto
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {barbeiro.nome}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${barbeiro.ativo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                    >
                      {barbeiro.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </h2>
                  <p>{barbeiro.telefone || "Sem telefone"}</p>
                  <p>{barbeiro.especialidade || "Sem especialidade"}</p>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => editarBarbeiro(barbeiro)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => pedirConfirmacaoDeletar(barbeiro)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Tem certeza?</h3>
            <p className="mb-4">Tem certeza que deseja deletar este barbeiro?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelarDeletar} className="px-4 py-2 rounded border">
                Cancelar
              </button>

              <button onClick={confirmarDeletar} className="px-4 py-2 rounded bg-red-500 text-white">
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Barbeiros;
