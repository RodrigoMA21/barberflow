import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import EmptyState from "../components/ui/EmptyState";

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const { t } = useTranslation();
  const notify = useNotify();

  async function carregarServicos() {
    const response = await api("/servicos");
    if (!response.ok) return;
    const data = await response.json();
    setServicos(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void (async () => {
      await carregarServicos();
    })();
  }, []);

  async function cadastrarServico(e) {
    e.preventDefault();
    const novoServico = { nome, preco, descricao };
    const response = await api("/servicos", {
      method: "POST",
      body: JSON.stringify(novoServico),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao cadastrar serviço");
      return;
    }
    setNome("");
    setPreco("");
    setDescricao("");
    setFormAberto(false);
    notify(t("common.saveSuccess"), "success");
    carregarServicos();
  }

  async function deletarServico(id) {
    const confirmar = window.confirm(t("common.confirmDeleteMessage"));
    if (!confirmar) return;
    const response = await api(`/servicos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao deletar serviço");
      return;
    }
    notify(t("common.deleteSuccess"), "success");
    carregarServicos();
  }

  function iniciarEdicao(servico) {
    setEditandoId(servico.id);
    setNome(servico.nome);
    setPreco(servico.preco);
    setDescricao(servico.descricao || "");
    setFormAberto(true);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    const servicoAtualizado = { nome, preco, descricao };
    const response = await api(`/servicos/${editandoId}`, {
      method: "PUT",
      body: JSON.stringify(servicoAtualizado),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao atualizar serviço");
      return;
    }
    setEditandoId(null);
    setNome("");
    setPreco("");
    setDescricao("");
    setFormAberto(false);
    notify(t("common.updateSuccess"), "success");
    carregarServicos();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setPreco("");
    setDescricao("");
    setFormAberto(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {servicos.length > 0 && (
        <button onClick={() => { setEditandoId(null); setNome(""); setPreco(""); setDescricao(""); setFormAberto(true); }} className="btn-primary mb-6">
          {t("common.create")}
        </button>
      )}

      <div className="space-y-4">
        {servicos.length === 0 ? (
          <EmptyState
            title={t("servicos.emptyTitle")}
            description={t("servicos.emptyDescription")}
            action={
              <button onClick={() => { setEditandoId(null); setNome(""); setPreco(""); setDescricao(""); setFormAberto(true); }} className="btn-primary">
                {t("common.create")}
              </button>
            }
          />
        ) : (
        servicos.map((servico) => (
          <div key={servico.id} className="card-static p-5 animate-fade-in-up hover:shadow-card-hover hover:border-border-hover transition-all duration-200">
            <h2 className="text-xl font-semibold text-text tracking-tight">{servico.nome}</h2>
            <p className="text-text-secondary mt-1">R$ {servico.preco}</p>
            {servico.descricao && <p className="text-text-tertiary text-sm mt-1">{servico.descricao}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => iniciarEdicao(servico)} className="btn-primary text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("common.edit")}
              </button>
              <button onClick={() => deletarServico(servico.id)} className="btn-danger text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("common.delete")}
              </button>
            </div>
          </div>
        )))}
      </div>

      {formAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-12 overflow-y-auto" onClick={() => setFormAberto(false)}>
          <div className="bg-surface border border-border/50 rounded-2xl shadow-modal max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={editandoId ? salvarEdicao : cadastrarServico}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-base font-semibold text-text tracking-tight">{editandoId ? t("common.edit") : t("common.create")}</div>
                <button type="button" onClick={limparFormulario} className="btn-ghost btn-icon">&times;</button>
              </div>
              <div className="mb-4">
                <label className="input-label">{t("common.name")}</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
              </div>
              <div className="mb-4">
                <label className="input-label">{t("common.price")}</label>
                <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="input" />
              </div>
              <div className="mb-4">
                <label className="input-label">{t("common.description")}</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="input" rows={3} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary">
                  {editandoId ? t("common.update") : t("common.create")}
                </button>
                <button type="button" onClick={limparFormulario} className="btn-secondary">
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicos;
