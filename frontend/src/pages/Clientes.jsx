import { useEffect, useState } from "react";

function Clientes() {
  const [clientes, setClientes] = useState([]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);

  async function carregarClientes() {
    const response = await fetch("http://localhost:3000/clientes");

    const data = await response.json();

    setClientes(data);
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function cadastrarCliente(e) {
    e.preventDefault();

    const clienteData = {
      nome,
      telefone,
    };

    if (clienteEditando) {
      await fetch(`http://localhost:3000/clientes/${clienteEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      });

      setClienteEditando(null);
    } else {
      await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      });
    }

    setNome("");
    setTelefone("");

    carregarClientes();
  }

  async function deletarCliente(id) {
    await fetch(`http://localhost:3000/clientes/${id}`, {
      method: "DELETE",
    });

    carregarClientes();
  }

  function pedirConfirmacaoDeletar(cliente) {
    setClienteParaDeletar(cliente);
    setShowConfirm(true);
  }

  async function confirmarDeletar() {
    if (!clienteParaDeletar) return;

    await deletarCliente(clienteParaDeletar.id);

    setShowConfirm(false);
    setClienteParaDeletar(null);
  }

  function cancelarDeletar() {
    setShowConfirm(false);
    setClienteParaDeletar(null);
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente);

    setNome(cliente.nome);
    setTelefone(cliente.telefone);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Clientes</h1>

      <form
        onSubmit={cadastrarCliente}
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
          <label className="block mb-1">Telefone</label>

          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {clienteEditando ? "Atualizar" : "Cadastrar"}
        </button>
      </form>

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{cliente.nome}</h2>

            <p>{cliente.telefone}</p>

            <button
              onClick={() => pedirConfirmacaoDeletar(cliente)}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
            >
              Deletar
            </button>

            <button
              onClick={() => editarCliente(cliente)}
              className="mt-3 ml-3 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Editar
            </button>
          </div>
        ))}
      </div>
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Tem certeza?</h3>
            <p className="mb-4">Tem certeza que deseja deletar este cliente?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarDeletar}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarDeletar}
                className="px-4 py-2 rounded bg-red-500 text-white"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
