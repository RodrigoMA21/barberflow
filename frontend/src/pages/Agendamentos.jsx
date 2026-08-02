import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time, minutes) {
  const total = toMinutes(time) + Number(minutes || 0);
  const hours = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mins = String(total % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function statusLabel(status, t) {
  const map = {
    agendado: t("agendamentos.scheduled"),
    confirmado: t("agendamentos.confirmed"),
    concluido: t("agendamentos.completed"),
    cancelado: t("agendamentos.cancelled"),
    nao_compareceu: t("agendamentos.noShow"),
  };
  return map[status] || status || t("agendamentos.scheduled");
}

function statusClass(status) {
  const map = {
    agendado: "badge-info",
    confirmado: "badge-warning",
    concluido: "badge-success",
    cancelado: "badge-error",
    nao_compareceu: "badge-neutral",
  };
  return map[status] || "badge-neutral";
}

function Agendamentos() {
  const [searchParams] = useSearchParams();
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const notify = useNotify();
  const { t } = useTranslation();

  const [clienteId, setClienteId] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [servicoIds, setServicoIds] = useState([]);
  const [status, setStatus] = useState("agendado");
  const [descontoValor, setDescontoValor] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  async function carregarAgendamentos() {
    const response = await api("/agendamentos");
    if (!response.ok) return;
    const responseData = await response.json();
    setAgendamentos(Array.isArray(responseData) ? responseData : []);
  }

  async function carregarClientes() {
    const response = await api("/clientes");
    if (!response.ok) return;
    const responseData = await response.json();
    setClientes(Array.isArray(responseData) ? responseData : []);
  }

  async function carregarServicos() {
    const response = await api("/servicos");
    if (!response.ok) return;
    const responseData = await response.json();
    setServicos(Array.isArray(responseData) ? responseData : []);
  }

  async function carregarBarbeiros() {
    const response = await api("/barbeiros");
    if (!response.ok) return;
    const responseData = await response.json();
    setBarbeiros(Array.isArray(responseData) ? responseData.filter((b) => b.ativo) : []);
  }

  useEffect(() => {
    carregarAgendamentos();
    carregarClientes();
    carregarServicos();
    carregarBarbeiros();
  }, []);

  useEffect(() => {
    if (agendamentos.length === 0) return;
    const editId = searchParams.get("edit");
    const dataParam = searchParams.get("data");
    const horarioParam = searchParams.get("horario");
    const barbeiroParam = searchParams.get("barbeiro_id");
    const clienteParam = searchParams.get("cliente_id");
    if (editId) {
      const agendamento = agendamentos.find((item) => String(item.id) === editId);
      if (agendamento && String(editingId || "") !== editId) {
        iniciarEdicao(agendamento);
      }
      return;
    }
    if (!editingId && (dataParam || horarioParam || barbeiroParam || clienteParam)) {
      if (dataParam) setData(dataParam);
      if (horarioParam) setHorario(horarioParam);
      if (barbeiroParam) setBarbeiroId(barbeiroParam);
      if (clienteParam) setClienteId(clienteParam);
      setStatus("agendado");
    }
  }, [agendamentos, editingId, searchParams]);

  const servicosSelecionados = useMemo(
    () => servicos.filter((s) => servicoIds.includes(String(s.id))),
    [servicos, servicoIds],
  );

  const duracaoTotalMinutos = useMemo(
    () => servicosSelecionados.reduce((total, s) => total + Number(s.duracao_minutos || 30), 0),
    [servicosSelecionados],
  );

  const valorBruto = useMemo(
    () => servicosSelecionados.reduce((total, s) => total + Number(s.preco || 0), 0),
    [servicosSelecionados],
  );

  const valorFinalCalculado = useMemo(() => {
    if (valorFinal !== "") return Math.max(Number(valorFinal) || 0, 0);
    return Math.max(valorBruto - (Number(descontoValor) || 0), 0);
  }, [descontoValor, valorBruto, valorFinal]);

  const terminoPrevisto = useMemo(() => {
    if (!horario || !duracaoTotalMinutos) return "";
    return addMinutesToTime(horario, duracaoTotalMinutos);
  }, [horario, duracaoTotalMinutos]);

  async function criarAgendamento(e) {
    e.preventDefault();
    const novoAgendamento = {
      cliente_id: clienteId,
      barbeiro_id: barbeiroId,
      servico_ids: servicoIds,
      data, horario, status,
      desconto_valor: descontoValor === "" ? 0 : Number(descontoValor),
      valor_final: valorFinal === "" ? null : Number(valorFinal),
    };
    const isEditing = !!editingId;
    const response = isEditing
      ? await api(`/agendamentos/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(novoAgendamento),
        })
      : await api("/agendamentos", {
          method: "POST",
          body: JSON.stringify(novoAgendamento),
        });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || t("agendamentos.saveError"));
      return;
    }
    notify(isEditing ? t("agendamentos.savedSuccess") : t("agendamentos.createdSuccess"), "success");
    setClienteId(""); setBarbeiroId(""); setServicoIds([]);
    setData(""); setHorario(""); setStatus("agendado");
    setDescontoValor(""); setValorFinal(""); setEditingId(null);
    carregarAgendamentos();
  }

  async function deletarAgendamento(agendamento) {
    const id = agendamento.id;
    const msg = agendamento.status === "concluido"
      ? t("agendamentos.confirmDeleteWithLoyalty")
      : t("common.confirmDeleteMessage");
    const confirmar = window.confirm(msg);
    if (!confirmar) return;
    await api(`/agendamentos/${id}`, { method: "DELETE" });
    notify(t("common.deleteSuccess"), "success");
    carregarAgendamentos();
  }

  async function atualizarStatusAgendamento(id, novoStatus) {
    const response = await api(`/agendamentos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: novoStatus }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || t("agendamentos.saveError"));
      return;
    }
    carregarAgendamentos();
    notify(t("agendamentos.statusUpdated"), "success");
  }

  async function registrarNoCartaoFidelidade(agendamento, observacao) {
    if (!agendamento.cliente_id) return;
    const response = await api(`/clientes/${agendamento.cliente_id}/cartao-fidelidade`, {
      method: "POST",
      body: JSON.stringify({
        data_atendimento: agendamento.data ? agendamento.data.split("T")[0] : new Date().toISOString().split("T")[0],
        observacao: observacao || "Atendimento concluído",
        auto: true,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao registrar no cartão fidelidade");
    }
  }

  async function concluirAgendamento(agendamento) {
    const response = await api(`/agendamentos/${agendamento.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "concluido" }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || t("agendamentos.saveError"));
      return;
    }
    await registrarNoCartaoFidelidade(agendamento);
    carregarAgendamentos();
  }

  function iniciarEdicao(agendamento) {
    setEditingId(agendamento.id);
    setClienteId(agendamento.cliente_id ? String(agendamento.cliente_id) : "");
    setBarbeiroId(agendamento.barbeiro_id ? String(agendamento.barbeiro_id) : "");
    setData(agendamento.data ? agendamento.data.split("T")[0] : "");
    setHorario(agendamento.horario || "");
    setServicoIds(agendamento.servicos ? agendamento.servicos.map((s) => String(s.id)) : []);
    setStatus(agendamento.status || "agendado");
    setDescontoValor(agendamento.desconto_valor ?? "");
    setValorFinal(agendamento.valor_final ?? "");
  }

  function limparFormulario() {
    setEditingId(null);
    setClienteId(""); setBarbeiroId(""); setServicoIds([]);
    setData(""); setHorario(""); setStatus("agendado");
    setDescontoValor(""); setValorFinal("");
  }

  const agora = new Date();
  const proximos = agendamentos.filter((ag) => {
    const inicio = ag.inicio_em ? new Date(ag.inicio_em) : new Date(`${ag.data}T${ag.horario || "00:00"}`);
    return inicio >= agora && ["agendado", "confirmado"].includes(ag.status);
  });

  return (
    <div className="space-y-6">
      <form onSubmit={criarAgendamento} className="card-static p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">{t("agendamentos.client")}</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="select">
              <option value="">{t("agendamentos.selectClient")}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">{t("agendamentos.barber")}</label>
            <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="select">
              <option value="">{t("agendamentos.selectBarber")}</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">{t("agendamentos.date")}</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("agendamentos.time")}</label>
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("agendamentos.status")}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="select">
              <option value="agendado">{t("agendamentos.scheduled")}</option>
              <option value="confirmado">{t("agendamentos.confirmed")}</option>
              <option value="concluido">{t("agendamentos.completed")}</option>
              <option value="cancelado">{t("agendamentos.cancelled")}</option>
              <option value="nao_compareceu">{t("agendamentos.noShow")}</option>
            </select>
          </div>
          <div>
            <label className="input-label">{t("agendamentos.discount")}</label>
            <input type="number" min="0" step="0.01" value={descontoValor} onChange={(e) => setDescontoValor(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("agendamentos.finalValue")}</label>
            <input type="number" min="0" step="0.01" value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} className="input" />
          </div>
        </div>

        <div className="mb-4 mt-4">
          <label className="input-label">{t("agendamentos.services")}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {servicos.map((servico) => {
              const selected = servicoIds.includes(String(servico.id));
              return (
                <button type="button" key={servico.id} onClick={() => {
                  const id = String(servico.id);
                  setServicoIds(selected ? servicoIds.filter((s) => s !== id) : [...servicoIds, id]);
                }} className={`text-left rounded-lg border-2 p-4 transition-all cursor-pointer backdrop-blur-sm ${selected ? "border-primary bg-primary/20" : "border-border bg-surface/40 hover:border-border-hover"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm">{servico.nome}</span>
                    {selected && <span className="text-primary text-lg leading-none shrink-0">✓</span>}
                  </div>
                  <div className="mt-2 text-sm text-text-secondary space-y-0.5">
                    <div>R$ {Number(servico.preco).toFixed(2)}</div>
                    <div>{servico.duracao_minutos || 30} min</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-secondary rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="block text-text-tertiary">{t("agendamentos.startTime")}</span>
            <strong>{data && horario ? `${formatDateBR(data)} ${formatTime(horario)}` : `${t("agendamentos.informDate")} ${t("agendamentos.informTime")}`}</strong>
          </div>
          <div>
            <span className="block text-text-tertiary">{t("agendamentos.estimatedEnd")}</span>
            <strong>{terminoPrevisto ? `${formatDateBR(data)} ${terminoPrevisto}` : t("agendamentos.selectService")}</strong>
          </div>
          <div>
            <span className="block text-text-tertiary">{t("agendamentos.totalTime")}</span>
            <strong>{duracaoTotalMinutos ? `${duracaoTotalMinutos} min` : "0 min"}</strong>
          </div>
          <div>
            <span className="block text-text-tertiary">{t("agendamentos.amount")}</span>
            <strong>R$ {valorFinalCalculado.toFixed(2)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">
            {editingId ? t("common.save") : t("agendamentos.create")}
          </button>
          {editingId && (
            <button type="button" onClick={limparFormulario} className="btn-secondary">
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-2xl font-semibold">{t("agendamentos.nextAppointments")}</h3>
            <p className="text-sm text-text-tertiary">{t("agendamentos.historyNote")}</p>
          </div>
          <div className="space-y-4">
            {proximos.length > 0 ? proximos.map((agendamento) => (
              <div key={agendamento.id} className="card-static p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{agendamento.cliente}</h2>
                    <p className="text-sm text-text-tertiary">{agendamento.barbeiro || "—"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusClass(agendamento.status)}`}>
                    {statusLabel(agendamento.status, t)}
                  </span>
                </div>
                <p>{t("agendamentos.services")}: {agendamento.servicos && agendamento.servicos.length > 0 ? agendamento.servicos.map((s) => s.nome).join(", ") : "—"}</p>
                <p>{t("agendamentos.duration")}: {agendamento.duracao_total_minutos || 0} min</p>
                <p>{t("agendamentos.startTime")}: {formatDateBR(agendamento.data)} {formatTime(agendamento.horario)}</p>
                <p>{t("agendamentos.endTime")}: {formatDateBR(agendamento.data)} {formatTime(agendamento.termino_em || addMinutesToTime(agendamento.horario, agendamento.duracao_total_minutos))}</p>
                <p>{t("agendamentos.grossValue")}: R$ {Number(agendamento.total_bruto || 0).toFixed(2)}</p>
                <p>{t("agendamentos.discount")}: R$ {Number(agendamento.desconto_valor || 0).toFixed(2)}</p>
                <p>{t("agendamentos.amount")}: R$ {Number(agendamento.total || 0).toFixed(2)}</p>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {agendamento.status === "agendado" && (
                    <button onClick={() => atualizarStatusAgendamento(agendamento.id, "confirmado")} className="btn-success px-4 py-2">
                      {t("agendamentos.confirmAction")}
                    </button>
                  )}
                  {agendamento.status === "confirmado" && (
                    <button onClick={() => concluirAgendamento(agendamento)} className="btn-success px-4 py-2">
                      {t("agendamentos.completeAction")}
                    </button>
                  )}
                  <button onClick={() => iniciarEdicao(agendamento)} className="btn-primary">{t("common.edit")}</button>
                  <button onClick={() => deletarAgendamento(agendamento)} className="btn-danger">{t("common.delete")}</button>
                </div>
              </div>
            )) : (
              <p className="text-text-tertiary">{t("agendamentos.noFutureAppointments")}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Agendamentos;
