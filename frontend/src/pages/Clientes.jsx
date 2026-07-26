import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);
  const { t } = useTranslation();

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
    const clienteData = { nome, telefone };
    if (clienteEditando) {
      await fetch(`http://localhost:3000/clientes/${clienteEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteData),
      });
      setClienteEditando(null);
    } else {
      await fetch("http://localhost:3000/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteData),
      });
    }
    setNome("");
    setTelefone("");
    carregarClientes();
  }

  async function deletarCliente(id) {
    await fetch(`http://localhost:3000/clientes/${id}`, { method: "DELETE" });
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
      <form onSubmit={cadastrarCliente} className="bg-white p-6 rounded shadow mb-6">
        <div className="mb-4">
          <label className="block mb-1">{t("common.name")}</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">{t("common.phone")}</label>
          <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {clienteEditando ? t("common.update") : t("common.create")}
        </button>
      </form>

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{cliente.nome}</h2>
            <p>{cliente.telefone}</p>
            <button onClick={() => pedirConfirmacaoDeletar(cliente)} className="mt-3 bg-red-500 text-white px-4 py-2 rounded">
              {t("common.delete")}
            </button>
            <button onClick={() => editarCliente(cliente)} className="mt-3 ml-3 bg-blue-500 text-white px-4 py-2 rounded">
              {t("common.edit")}
            </button>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{t("common.confirm")}</h3>
            <p className="mb-4">{t("common.confirmDeleteMessage")}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelarDeletar} className="px-4 py-2 rounded border">{t("common.cancel")}</button>
              <button onClick={confirmarDeletar} className="px-4 py-2 rounded bg-red-500 text-white">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
