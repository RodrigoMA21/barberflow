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

function statusLabel(status) {
  const map = {
    agendado: "Agendado", confirmado: "Confirmado", concluido: "Concluído",
    cancelado: "Cancelado", nao_compareceu: "Não compareceu",
  };
  return map[status] || status || "Agendado";
}

function statusClass(status) {
  const map = {
    agendado: "bg-blue-100 text-blue-700", confirmado: "bg-amber-100 text-amber-700",
    concluido: "bg-green-100 text-green-700", cancelado: "bg-red-100 text-red-700",
    nao_compareceu: "bg-gray-200 text-gray-700",
  };
  return map[status] || "bg-gray-200 text-gray-700";
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

  const carregarHistorico = useCallback(async (pageAtual = page) => {
    const params = new URLSearchParams();
    params.append("page", String(pageAtual));
    params.append("limit", String(limit));
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (clienteId) params.append("cliente_id", clienteId);
    const res = await api(`/agendamentos/historico?${params.toString()}`);
    const data = await res.json();
    setHistorico(data.data || []);
    setMeta(data.meta || { page: pageAtual, limit, total: 0 });
  }, [clienteId, limit, month, page, year]);

  useEffect(() => {
    void (async () => {
      const resClientes = await api("/clientes");
      const clientesData = await resClientes.json();
      setClientes(clientesData);
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", String(limit));
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (clienteId) params.append("cliente_id", clienteId);
      const resHistorico = await api(`/agendamentos/historico?${params.toString()}`);
      const historicoData = await resHistorico.json();
      setHistorico(historicoData.data || []);
      setMeta(historicoData.meta || { page: 1, limit, total: 0 });
    })();
  }, [clienteId, limit, month, year]);

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
    <div>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">{t("historico.filters")}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">{t("historico.month")}</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border p-2 rounded">
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
            <label className="block mb-1">{t("historico.year")}</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder={t("common.all")} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1">{t("historico.client")}</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">{t("common.all")}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={aplicarFiltros} className="bg-black text-white px-4 py-2 rounded">{t("historico.apply")}</button>
          <button onClick={limparFiltros} className="bg-gray-300 text-black px-4 py-2 rounded">{t("historico.clear")}</button>
        </div>
      </div>

      <div className="space-y-4">
        {historico.map((h) => (
          <div key={h.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{h.cliente}</h2>
                <p className="text-sm text-gray-500">{h.barbeiro || t("historico.noAppointments")}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusClass(h.status)}`}>{statusLabel(h.status)}</span>
            </div>
            <p>{t("historico.dateTimeLabel")} {formatDateTime(h.data, h.horario)}</p>
            <p>{t("historico.servicesLabel")} {h.servicos && h.servicos.length > 0 ? h.servicos.map((s) => s.nome).join(", ") : "—"}</p>
            <p>{t("historico.grossValueLabel")} R$ {Number(h.total_bruto || 0).toFixed(2)}</p>
            <p>{t("historico.discountLabel")} R$ {Number(h.desconto_valor || 0).toFixed(2)}</p>
            <p>{t("historico.finalValueLabel")} R$ {Number(h.total || 0).toFixed(2)}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" onClick={() => editarAgendamento(h.id)} className="bg-yellow-500 text-white px-4 py-2 rounded">
                {t("historico.edit")}
              </button>
              <button type="button" onClick={() => excluirAgendamento(h.id)} className="bg-red-500 text-white px-4 py-2 rounded">
                {t("historico.delete")}
              </button>
            </div>
          </div>
        ))}
        {historico.length === 0 && (
          <div className="bg-white p-4 rounded shadow">{t("historico.noHistoryMessage")}</div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between bg-white p-4 rounded shadow">
        <button onClick={() => irParaPagina(page - 1)} disabled={page <= 1} className="bg-gray-300 text-black px-4 py-2 rounded disabled:opacity-50">
          {t("common.previous")}
        </button>
        <span>{t("historico.pageInfo", { page: meta.page || page, total: totalPages })}</span>
        <button onClick={() => irParaPagina(page + 1)} disabled={page >= totalPages} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
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
