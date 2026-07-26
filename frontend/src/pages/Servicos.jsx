import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const { t } = useTranslation();

  async function carregarServicos() {
    const response = await api("/servicos");
    const data = await response.json();
    setServicos(data);
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  async function cadastrarServico(e) {
    e.preventDefault();
    const novoServico = { nome, preco };
    await api("/servicos", {
      method: "POST",
      body: JSON.stringify(novoServico),
    });
    setNome("");
    setPreco("");
    carregarServicos();
  }

  async function deletarServico(id) {
    const confirmar = window.confirm(t("common.confirmDeleteMessage"));
    if (!confirmar) return;
    await api(`/servicos/${id}`, { method: "DELETE" });
    carregarServicos();
  }

  function iniciarEdicao(servico) {
    setEditandoId(servico.id);
    setNome(servico.nome);
    setPreco(servico.preco);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    const servicoAtualizado = { nome, preco };
    await api(`/servicos/${editandoId}`, {
      method: "PUT",
      body: JSON.stringify(servicoAtualizado),
    });
    setEditandoId(null);
    setNome("");
    setPreco("");
    carregarServicos();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={editandoId ? salvarEdicao : cadastrarServico} className="card-static p-6">
        <div className="mb-4">
          <label className="input-label">{t("common.name")}</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
        </div>
        <div className="mb-4">
          <label className="input-label">{t("common.price")}</label>
          <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="input" />
        </div>
        <button type="submit" className="btn-primary">
          {editandoId ? t("common.update") : t("common.create")}
        </button>
      </form>

      <div className="space-y-4">
        {servicos.map((servico) => (
          <div key={servico.id} className="card-static p-4 animate-fade-in-up">
            <h2 className="text-xl font-semibold text-text">{servico.nome}</h2>
            <p className="text-text-secondary">R$ {servico.preco}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => iniciarEdicao(servico)} className="btn-ghost px-4 py-2 rounded-lg text-sm">
                {t("common.edit")}
              </button>
              <button onClick={() => deletarServico(servico.id)} className="bg-error text-white px-4 py-2 rounded-lg text-sm">
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Servicos;
