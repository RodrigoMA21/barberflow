import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cartoesPorCliente, setCartoesPorCliente] = useState({});
  const [historicoPorCliente, setHistoricoPorCliente] = useState({});
  const [clienteAbertoId, setClienteAbertoId] = useState(null);
  const notify = useNotify();
  const { t } = useTranslation();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cartaoFidelidadeAtivo, setCartaoFidelidadeAtivo] = useState(false);
  const [cartaoFidelidadeCarimbos, setCartaoFidelidadeCarimbos] = useState(0);
  const [cartaoFidelidadeMeta, setCartaoFidelidadeMeta] = useState(10);
  const [cartaoDrafts, setCartaoDrafts] = useState({});
  const [clienteFidelidadeModal, setClienteFidelidadeModal] = useState(null);

  const [clienteEditandoModal, setClienteEditandoModal] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editFidelidadeAtivo, setEditFidelidadeAtivo] = useState(false);
  const [editFidelidadeCarimbos, setEditFidelidadeCarimbos] = useState(0);
  const [editFidelidadeMeta, setEditFidelidadeMeta] = useState(10);

  const [showConfirm, setShowConfirm] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);
  const [showCriarModal, setShowCriarModal] = useState(false);

  async function carregarClientes() {
    const response = await api("/clientes");
    const data = await response.json();
    setClientes(data);
  }

  async function carregarCartaoFidelidade(clienteId) {
    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`);
    const data = await response.json();
    setCartoesPorCliente((prev) => ({
      ...prev,
      [clienteId]: Array.isArray(data) ? data : [],
    }));
  }

  async function carregarHistoricoCliente(clienteId) {
    const response = await api(`/agendamentos/historico?cliente_id=${clienteId}&page=1&limit=20`);
    const data = await response.json();
    setHistoricoPorCliente((prev) => ({
      ...prev,
      [clienteId]: Array.isArray(data.data) ? data.data : [],
    }));
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function cadastrarCliente(e) {
    e.preventDefault();
    const clienteData = {
      nome, telefone, email, cpf,
      cartao_fidelidade_ativo: cartaoFidelidadeAtivo,
      cartao_fidelidade_carimbos: cartaoFidelidadeCarimbos,
      cartao_fidelidade_meta: cartaoFidelidadeMeta,
    };
    await api("/clientes", {
      method: "POST",
      body: JSON.stringify(clienteData),
    });
    setNome(""); setTelefone(""); setEmail(""); setCpf("");
    setCartaoFidelidadeAtivo(false);
    setCartaoFidelidadeCarimbos(0);
    setCartaoFidelidadeMeta(10);
    carregarClientes();
  }

  async function deletarCliente(id) {
    await api(`/clientes/${id}`, { method: "DELETE" });
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

  function abrirEdicao(cliente) {
    setClienteEditandoModal(cliente);
    setEditNome(cliente.nome);
    setEditTelefone(cliente.telefone);
    setEditEmail(cliente.email || "");
    setEditCpf(cliente.cpf || "");
    setEditFidelidadeAtivo(Boolean(cliente.cartao_fidelidade_ativo));
    setEditFidelidadeCarimbos(Number(cliente.cartao_fidelidade_carimbos) || 0);
    setEditFidelidadeMeta(Number(cliente.cartao_fidelidade_meta) || 10);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    if (!clienteEditandoModal) return;
    await api(`/clientes/${clienteEditandoModal.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome: editNome,
        telefone: editTelefone,
        email: editEmail,
        cpf: editCpf,
        cartao_fidelidade_ativo: editFidelidadeAtivo,
        cartao_fidelidade_carimbos: editFidelidadeCarimbos,
        cartao_fidelidade_meta: editFidelidadeMeta,
      }),
    });
    setClienteEditandoModal(null);
    carregarClientes();
  }

  async function adicionarAtendimentoNoCartao(clienteId) {
    const draft = cartaoDrafts[clienteId] || {};
    if (!draft.dataAtendimento) {
      notify(t("clientes.informDate"));
      return;
    }
    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`, {
      method: "POST",
      body: JSON.stringify({
        data_atendimento: draft.dataAtendimento,
        observacao: draft.observacao || "",
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || t("clientes.informDate"));
      return;
    }
    setCartaoDrafts((prev) => ({
      ...prev,
      [clienteId]: { dataAtendimento: "", observacao: "" },
    }));
    carregarCartaoFidelidade(clienteId);
    carregarClientes();
  }

  async function limparCartaoFidelidade(clienteId) {
    const confirmar = window.confirm(t("clientes.cleanConfirm"));
    if (!confirmar) return;
    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao limpar cartão fidelidade");
      return;
    }
    carregarCartaoFidelidade(clienteId);
    carregarClientes();
  }

  async function usarCartaoFidelidade(clienteId) {
    const confirmar = window.confirm("Usar cartão fidelidade? O progresso será resetado.");
    if (!confirmar) return;
    const response = await api(`/clientes/${clienteId}/cartao-fidelidade/usar`, { method: "POST" });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao usar cartão fidelidade");
      return;
    }
    carregarCartaoFidelidade(clienteId);
    carregarClientes();
  }

  function abrirOuFecharCliente(cliente) {
    const novoAbertoId = clienteAbertoId === cliente.id ? null : cliente.id;
    setClienteAbertoId(novoAbertoId);
    if (novoAbertoId) {
      carregarCartaoFidelidade(cliente.id);
      carregarHistoricoCliente(cliente.id);
    }
  }

  async function abrirFidelidadeModal(cliente) {
    await carregarCartaoFidelidade(cliente.id);
    setClienteFidelidadeModal(cliente);
  }

  return (
    <div>
      <button onClick={() => setShowCriarModal(true)} className="bg-primary text-white px-4 py-2 rounded mb-6">
        {t("clientes.new")}
      </button>

      {showCriarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCriarModal(false)}>
          <div className="bg-surface border border-border rounded-2xl shadow-dropdown p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("clientes.new")}</h3>
              <button onClick={() => setShowCriarModal(false)} className="btn-ghost btn-icon text-lg">×</button>
            </div>
            <form onSubmit={(e) => { cadastrarCliente(e); setShowCriarModal(false); }}>
              <div className="mb-4">
                <label className="input-label">{t("common.name")}</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="input" required />
              </div>
              <div className="mb-4">
                <label className="input-label">{t("common.phone")}</label>
                <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="input" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="input-label">{t("clientes.email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="input-label">{t("clientes.cpf")}</label>
                  <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="input" />
                </div>
              </div>

              <div className="mb-4 card-static p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold">{t("clientes.loyaltyCard")}</h3>
                    <p className="text-text-secondary text-sm">{t("clientes.loyaltyDescription")}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={cartaoFidelidadeAtivo} onChange={(e) => setCartaoFidelidadeAtivo(e.target.checked)} />
                    {t("clientes.active")}
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">{t("clientes.stamps")}</label>
                    <input type="number" min="0" value={cartaoFidelidadeCarimbos} onChange={(e) => setCartaoFidelidadeCarimbos(Number(e.target.value) || 0)} className="input" />
                  </div>
                  <div>
                    <label className="input-label">{t("clientes.goal")}</label>
                    <input type="number" min="1" value={cartaoFidelidadeMeta} onChange={(e) => setCartaoFidelidadeMeta(Number(e.target.value) || 10)} className="input" />
                  </div>
                </div>
                <div className="mt-4 card-static p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">{t("clientes.progress")}</span>
                    <span>{cartaoFidelidadeCarimbos}/{cartaoFidelidadeMeta}</span>
                  </div>
                  <div className="h-3 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (Number(cartaoFidelidadeCarimbos) / Math.max(Number(cartaoFidelidadeMeta), 1)) * 100)}%` }} />
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">{t("clientes.loyaltyHelp")}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCriarModal(false)} className="btn-ghost px-4 py-2 rounded">
                  {t("common.cancel")}
                </button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
                  {t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="card-static p-4">
            <button type="button" onClick={() => abrirOuFecharCliente(cliente)} className="text-left w-full">
              <h2 className="text-xl font-semibold text-text hover:text-text-secondary">{cliente.nome}</h2>
            </button>
            <p>{cliente.telefone}</p>
            <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
              <span className={`px-2 py-1 rounded-full font-medium ${cliente.cartao_fidelidade_ativo ? "badge-success" : "badge-neutral"}`}>
                {cliente.cartao_fidelidade_ativo ? t("clientes.active") : t("clientes.inactive")}
              </span>
              <span className="text-text-secondary">{Number(cliente.cartao_fidelidade_carimbos) || 0}/{Number(cliente.cartao_fidelidade_meta) || 10}</span>
              {Number(cliente.cartao_fidelidade_usados) > 0 && (
                <span className="badge-info px-2 py-1 rounded-full text-xs">{Number(cliente.cartao_fidelidade_usados)} usados</span>
              )}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => pedirConfirmacaoDeletar(cliente)} className="bg-error text-white px-4 py-2 rounded text-sm">
                {t("common.delete")}
              </button>
              <button onClick={() => abrirEdicao(cliente)} className="bg-primary text-white px-4 py-2 rounded text-sm">
                {t("common.edit")}
              </button>
              <button onClick={() => abrirFidelidadeModal(cliente)} className="btn-ghost px-4 py-2 rounded text-sm">
                {t("clientes.viewCard")}
              </button>
            </div>

            {clienteAbertoId === cliente.id && (
              <div className="mt-4 pt-4 border-border border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-secondary rounded p-3">
                    <span className="block text-xs text-text-tertiary">{t("clientes.email")}</span>
                    <strong className="text-text">{cliente.email || "—"}</strong>
                  </div>
                  <div className="bg-surface-secondary rounded p-3">
                    <span className="block text-xs text-text-tertiary">{t("clientes.cpf")}</span>
                    <strong className="text-text">{cliente.cpf || "—"}</strong>
                  </div>
                  <div className="bg-surface-secondary rounded p-3">
                    <span className="block text-xs text-text-tertiary">{t("clientes.registrationDate")}</span>
                    <strong className="text-text">{formatDateBR(cliente.created_at)}</strong>
                  </div>
                </div>

                <div className="card-static p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold">{t("clientes.loyaltyCard")}</h3>
                    <div className="flex gap-2">
                      {Number(cliente.cartao_fidelidade_carimbos) >= Number(cliente.cartao_fidelidade_meta) && Number(cliente.cartao_fidelidade_meta) > 0 && (
                        <button type="button" onClick={() => usarCartaoFidelidade(cliente.id)} className="badge-warning px-3 py-2 rounded text-sm font-medium">
                          Usar cartão
                        </button>
                      )}
                      <button type="button" onClick={() => carregarCartaoFidelidade(cliente.id)} className="btn-ghost px-3 py-2 rounded text-sm">
                        {t("clientes.refresh")}
                      </button>
                      <button type="button" onClick={() => limparCartaoFidelidade(cliente.id)} className="bg-error text-white px-3 py-2 rounded text-sm">
                        {t("clientes.clearCard")}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full font-medium ${cliente.cartao_fidelidade_ativo ? "badge-success" : "badge-neutral"}`}>
                        {cliente.cartao_fidelidade_ativo ? t("clientes.active") : t("clientes.inactive")}
                      </span>
                      <span className="text-text-secondary">{Number(cliente.cartao_fidelidade_carimbos) || 0}/{Number(cliente.cartao_fidelidade_meta) || 10}</span>
                    </div>
                    {Number(cliente.cartao_fidelidade_usados) > 0 && (
                      <span className="text-text-tertiary">{Number(cliente.cartao_fidelidade_usados)} cartão(ns) usado(s)</span>
                    )}
                  </div>
                  <div className="h-4 rounded-full bg-surface-tertiary overflow-hidden mb-3">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (Number(cliente.cartao_fidelidade_carimbos) / Math.max(Number(cliente.cartao_fidelidade_meta), 1)) * 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input type="date" value={cartaoDrafts[cliente.id]?.dataAtendimento || ""} onChange={(e) => setCartaoDrafts((prev) => ({ ...prev, [cliente.id]: { ...(prev[cliente.id] || {}), dataAtendimento: e.target.value } }))} className="input" />
                    <input type="text" value={cartaoDrafts[cliente.id]?.observacao || ""} onChange={(e) => setCartaoDrafts((prev) => ({ ...prev, [cliente.id]: { ...(prev[cliente.id] || {}), observacao: e.target.value } }))} placeholder={t("clientes.notes")} className="input md:col-span-1" />
                    <button type="button" onClick={() => adicionarAtendimentoNoCartao(cliente.id)} className="bg-primary text-white px-4 py-2 rounded">
                      {t("clientes.addDate")}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(cartoesPorCliente[cliente.id] || []).length > 0 ? (
                      cartoesPorCliente[cliente.id].map((registro) => (
                        <div key={registro.id} className="flex items-center justify-between card-static px-3 py-2 text-sm">
                          <span>{formatDateBR(registro.data_atendimento)}</span>
                          <span className="text-text-tertiary">{registro.observacao || t("clientes.noObservation")}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-tertiary">{t("clientes.noRecords")}</p>
                    )}
                  </div>
                </div>

                <div className="card-static p-4">
                  <div className="mb-2 text-sm text-text-tertiary">
                    {t("clientes.recentHistory")}
                  </div>
                  <h3 className="font-semibold mb-2">{t("clientes.history")}</h3>
                  <div className="space-y-2">
                    {(historicoPorCliente[cliente.id] || []).length > 0 ? (
                      historicoPorCliente[cliente.id].map((agendamento) => (
                        <div key={agendamento.id} className="card-static p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <strong>{agendamento.data ? formatDateBR(agendamento.data.split("T")[0]) + " " + String(agendamento.horario || "").slice(0, 5) : "—"}</strong>
                            <span className="text-text-secondary">{agendamento.status}</span>
                          </div>
                          <div className="mt-1 text-text-secondary">
                            {agendamento.servicos?.map((s) => s.nome).join(", ") || "—"}
                          </div>
                          <div className="mt-1 text-text-secondary">
                            {t("common.value")}: R$ {Number(agendamento.valor_final ?? agendamento.total ?? 0).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-tertiary">{t("clientes.noAppointments")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {clienteEditandoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClienteEditandoModal(null)}>
          <div className="bg-surface border border-border rounded-2xl shadow-dropdown p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("clientes.edit")}</h3>
              <button onClick={() => setClienteEditandoModal(null)} className="btn-ghost btn-icon text-lg">×</button>
            </div>
            <form onSubmit={salvarEdicao}>
              <div className="mb-4">
                <label className="input-label">{t("common.name")}</label>
                <input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} className="input" required />
              </div>
              <div className="mb-4">
                <label className="input-label">{t("common.phone")}</label>
                <input type="text" value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="input" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="input-label">{t("clientes.email")}</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="input-label">{t("clientes.cpf")}</label>
                  <input type="text" value={editCpf} onChange={(e) => setEditCpf(e.target.value)} className="input" />
                </div>
              </div>

              <div className="mb-4 card-static p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold">{t("clientes.loyaltyCard")}</h3>
                    <p className="text-text-secondary text-sm">{t("clientes.loyaltyDescription")}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editFidelidadeAtivo} onChange={(e) => setEditFidelidadeAtivo(e.target.checked)} />
                    {t("clientes.active")}
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">{t("clientes.stamps")}</label>
                    <input type="number" min="0" value={editFidelidadeCarimbos} onChange={(e) => setEditFidelidadeCarimbos(Number(e.target.value) || 0)} className="input" />
                  </div>
                  <div>
                    <label className="input-label">{t("clientes.goal")}</label>
                    <input type="number" min="1" value={editFidelidadeMeta} onChange={(e) => setEditFidelidadeMeta(Number(e.target.value) || 10)} className="input" />
                  </div>
                </div>
                {Number(clienteEditandoModal.cartao_fidelidade_usados) > 0 && (
                  <p className="mt-2 text-xs text-text-tertiary">{Number(clienteEditandoModal.cartao_fidelidade_usados)} cartão(ns) usado(s)</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setClienteEditandoModal(null)} className="btn-ghost px-4 py-2 rounded">
                  {t("common.cancel")}
                </button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="card-static p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{t("confirmDialog.title")}</h3>
            <p className="mb-4">{t("confirmDialog.message")}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelarDeletar} className="px-4 py-2 rounded border-border btn-ghost">{t("common.cancel")}</button>
              <button onClick={confirmarDeletar} className="px-4 py-2 rounded bg-error text-white">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {clienteFidelidadeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClienteFidelidadeModal(null)}>
          <div className="bg-surface border border-border rounded-2xl shadow-dropdown p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("clientes.loyaltyCard")} — {clienteFidelidadeModal.nome}</h3>
              <button onClick={() => setClienteFidelidadeModal(null)} className="btn-ghost btn-icon text-lg">×</button>
            </div>
            <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
              <span className={`px-2 py-1 rounded-full font-medium ${clienteFidelidadeModal.cartao_fidelidade_ativo ? "badge-success" : "badge-neutral"}`}>
                {clienteFidelidadeModal.cartao_fidelidade_ativo ? t("clientes.active") : t("clientes.inactive")}
              </span>
              <span className="text-text-secondary">{Number(clienteFidelidadeModal.cartao_fidelidade_carimbos) || 0}/{Number(clienteFidelidadeModal.cartao_fidelidade_meta) || 10}</span>
              {Number(clienteFidelidadeModal.cartao_fidelidade_usados) > 0 && (
                <span className="text-xs text-text-tertiary">{Number(clienteFidelidadeModal.cartao_fidelidade_usados)} usado(s)</span>
              )}
            </div>
            <div className="h-4 rounded-full bg-surface-tertiary overflow-hidden mb-4">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (Number(clienteFidelidadeModal.cartao_fidelidade_carimbos) / Math.max(Number(clienteFidelidadeModal.cartao_fidelidade_meta), 1)) * 100)}%` }} />
            </div>
            {Number(clienteFidelidadeModal.cartao_fidelidade_carimbos) >= Number(clienteFidelidadeModal.cartao_fidelidade_meta) && Number(clienteFidelidadeModal.cartao_fidelidade_meta) > 0 && (
              <button onClick={() => { usarCartaoFidelidade(clienteFidelidadeModal.id); setClienteFidelidadeModal(null); }} className="w-full mb-4 badge-warning px-4 py-3 rounded-lg text-sm font-semibold">
                Usar cartão fidelidade
              </button>
            )}
            <div className="space-y-2">
              {(cartoesPorCliente[clienteFidelidadeModal.id] || []).length > 0 ? (
                cartoesPorCliente[clienteFidelidadeModal.id].map((registro) => (
                  <div key={registro.id} className="flex items-center justify-between bg-surface-secondary rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="font-medium">{formatDateBR(registro.data_atendimento)}</span>
                    </div>
                    <span className="text-text-tertiary text-xs">{registro.observacao || t("clientes.noObservation")}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-tertiary text-center py-8">{t("clientes.noRecords")}</p>
              )}
            </div>
            <button onClick={() => setClienteFidelidadeModal(null)} className="btn-ghost w-full mt-4 py-2 rounded-lg text-sm">
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
