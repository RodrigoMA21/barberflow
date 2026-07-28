import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import AgendamentoModal from "../components/AgendamentoModal";

function formatDateTime(data, horario) {
  if (!data) return "";
  const datePart = data.includes("T") ? data.split("T")[0] : data;
  const timePart = horario ? horario.slice(0, 5) : "00:00";
  const iso = `${datePart}T${timePart}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const d2 = new Date(data);
    if (!isNaN(d2.getTime())) {
      return d2.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return "Data inválida";
  }
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status, t) {
  const map = {
    agendado: t("agendamentos.scheduled"), confirmado: t("agendamentos.confirmed"),
    concluido: t("agendamentos.completed"), cancelado: t("agendamentos.cancelled"),
    nao_compareceu: t("agendamentos.noShow"),
  };
  return map[status] || status || t("agendamentos.scheduled");
}

function statusClass(status) {
  const map = {
    agendado: "badge-info", confirmado: "badge-warning",
    concluido: "badge-success", cancelado: "badge-error",
    nao_compareceu: "badge-neutral",
  };
  return map[status] || "badge-neutral";
}

function Historico() {
  const [historico, setHistorico] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [page, setPage] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoInicial, setAgendamentoInicial] = useState(null);
  const { t } = useTranslation();
  const notify = useNotify();

  const limit = 6;

  async function carregarClientesLista() {
    const res = await api("/clientes");
    if (res.ok) {
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    }
  }

  const carregarHistorico = useCallback(async (pageAtual = 1) => {
    const params = new URLSearchParams();
    params.append("page", String(pageAtual));
    params.append("limit", String(limit));
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (clienteId) params.append("cliente_id", clienteId);
    const res = await api(`/agendamentos/historico?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setHistorico(Array.isArray(data.data) ? data.data : []);
    setMeta(data.meta || { page: pageAtual, limit, total: 0 });
  }, [clienteId, limit, month, year]);

  useEffect(() => {
    carregarClientesLista();
    carregarHistorico(1);
  }, [carregarHistorico]);

  async function excluirAgendamento(id) {
    const confirmar = window.confirm(t("common.confirmDeleteMessage"));
    if (!confirmar) return;
    const response = await api(`/agendamentos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao excluir agendamento");
      return;
    }
    carregarHistorico(page);
    notify(t("common.deleteSuccess"), "success");
  }

  function editarAgendamento(id) {
    const agendamento = historico.find((item) => String(item.id) === String(id));
    setAgendamentoInicial(agendamento || { id });
    setModalAberto(true);
  }

  function aplicarFiltros() {
    setPage(1);
    carregarHistorico(1);
  }

  function limparFiltros() {
    setMonth(""); setYear(""); setClienteId(""); setPage(1);
    carregarHistorico(1);
  }

  function irParaPagina(novaPagina) {
    if (novaPagina < 1) return;
    const totalPages = Math.max(1, Math.ceil((meta.total || 0) / meta.limit));
    if (novaPagina > totalPages) return;
    setPage(novaPagina);
    carregarHistorico(novaPagina);
  }

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / meta.limit));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-static p-5">
        <h2 className="text-base font-semibold mb-4 text-text">{t("historico.filters")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">{t("historico.month")}</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="select">
              <option value="">{t("common.all")}</option>
              <option value="1">{t("common.month_jan")}</option>
              <option value="2">{t("common.month_feb")}</option>
              <option value="3">{t("common.month_mar")}</option>
              <option value="4">{t("common.month_apr")}</option>
              <option value="5">{t("common.month_may")}</option>
              <option value="6">{t("common.month_jun")}</option>
              <option value="7">{t("common.month_jul")}</option>
              <option value="8">{t("common.month_aug")}</option>
              <option value="9">{t("common.month_sep")}</option>
              <option value="10">{t("common.month_oct")}</option>
              <option value="11">{t("common.month_nov")}</option>
              <option value="12">{t("common.month_dec")}</option>
            </select>
          </div>
          <div>
            <label className="input-label">{t("historico.year")}</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder={t("common.all")} className="input" />
          </div>
          <div>
            <label className="input-label">{t("historico.client")}</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="select">
              <option value="">{t("common.all")}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={aplicarFiltros} className="btn-primary">{t("historico.apply")}</button>
          <button onClick={limparFiltros} className="btn-ghost px-4 py-2 rounded-lg text-sm">{t("historico.clear")}</button>
        </div>
      </div>

      <div className="space-y-4">
        {historico.map((h) => (
          <div key={h.id} className="card-static p-4 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">{h.cliente}</h2>
                <p className="text-sm text-text-tertiary">{h.barbeiro || "—"}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass(h.status)}`}>{statusLabel(h.status, t)}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <p><span className="text-text-tertiary">{t("historico.dateTimeLabel")}</span> {formatDateTime(h.data, h.horario)}</p>
              <p><span className="text-text-tertiary">{t("historico.servicesLabel")}</span> {h.servicos && h.servicos.length > 0 ? h.servicos.map((s) => s.nome).join(", ") : "—"}</p>
              <p><span className="text-text-tertiary">{t("historico.grossValueLabel")}</span> R$ {Number(h.total_bruto || 0).toFixed(2)}</p>
              <p><span className="text-text-tertiary">{t("historico.discountLabel")}</span> R$ {Number(h.desconto_valor || 0).toFixed(2)}</p>
              <p><span className="text-text-tertiary">{t("historico.finalValueLabel")}</span> R$ {Number(h.total || 0).toFixed(2)}</p>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" onClick={() => editarAgendamento(h.id)} className="bg-primary text-white px-4 py-2 rounded text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("historico.edit")}
              </button>
              <button type="button" onClick={() => excluirAgendamento(h.id)} className="bg-error text-white px-4 py-2 rounded-lg text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("historico.delete")}
              </button>
            </div>
          </div>
        ))}
        {historico.length === 0 && (
          <div className="card-static p-8 text-center">
            <p className="text-text-tertiary">{t("historico.noHistoryMessage")}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between card-static px-4 py-3">
        <button onClick={() => irParaPagina(page - 1)} disabled={page <= 1} className="btn-ghost px-3 py-2 rounded-lg text-sm disabled:opacity-40">
          {t("common.previous")}
        </button>
        <span className="text-sm text-text-secondary">{t("historico.pageInfo", { page: meta.page || page, total: totalPages })}</span>
        <button onClick={() => irParaPagina(page + 1)} disabled={page >= totalPages} className="btn-primary disabled:opacity-40">
          {t("common.next")}
        </button>
      </div>

      <AgendamentoModal
        key={`${modalAberto ? "open" : "closed"}-${agendamentoInicial?.id || "new"}-${agendamentoInicial?.data || ""}-${agendamentoInicial?.horario || ""}`}
        open={modalAberto}
        initialData={agendamentoInicial}
        onClose={() => { setModalAberto(false); setAgendamentoInicial(null); }}
        onSaved={() => carregarHistorico(page)}
      />
    </div>
  );
}

export default Historico;
