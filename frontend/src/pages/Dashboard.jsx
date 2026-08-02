import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import ComparisonChart from "../components/charts/ComparisonChart";
import RevenueChart from "../components/charts/RevenueChart";
import AgendamentoModal from "../components/AgendamentoModal";
import ClockCard from "../components/dashboard/ClockCard";
import WeatherCard from "../components/dashboard/WeatherCard";

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

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

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}

function mondayOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return fmtDate(d);
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

function TrendBadge({ value, suffix = "%" }) {
  if (value === null || value === undefined) return null;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${isUp ? "trend-up bg-success-light" : "trend-down bg-error-light"}`}>
      <span className="text-[10px]">{isUp ? "↑" : "↓"}</span>
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

function KpiCard({ label, value, prefix = "R$", trend, icon, accent, cardAccent = "" }) {
  return (
    <div className={`card p-5 animate-fade-in-up ${cardAccent}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || "bg-primary-light text-primary"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text tracking-tight">
        {prefix === "R$" ? `R$ ${formatCurrency(value)}` : value}
      </p>
    </div>
  );
}

const kpiIcons = {
  revenue: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z",
  appointments: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  clients: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  barbers: "M12 5a7 7 0 1 1 0 14a7 7 0 1 1 0-14M3 7q9 3 18 0M8 6V1h8v5",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  service: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  ticket: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  pending: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [dataRef, setDataRef] = useState(() => fmtDate(new Date()));
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const [proximos, setProximos] = useState([]);
  const { t } = useTranslation();

  const carregarDashboard = useCallback(async () => {
    const params = new URLSearchParams();
    if (periodo === "dia") {
      params.set("periodo", "dia");
      params.set("data", dataRef);
    } else if (periodo === "semana") {
      params.set("periodo", "semana");
      params.set("data", dataRef);
    } else {
      params.set("periodo", "mes");
      params.set("mes", String(mes));
      params.set("ano", String(ano));
    }
    const response = await api(`/dashboard?${params.toString()}`);
    if (!response.ok) {
      setData(null);
      return;
    }
    const d = await response.json();
    setData(d);
  }, [periodo, mes, ano, dataRef]);

  const carregarProximos = useCallback(async () => {
    const hoje = new Date().toISOString().split("T")[0];
    const response = await api(`/agendamentos?data=${hoje}`);
    if (!response.ok) return;
    const todos = await response.json();
    const agora = new Date();
    const filtrados = todos.filter((ag) => {
      const inicio = ag.inicio_em ? new Date(ag.inicio_em) : new Date(`${ag.data}T${ag.horario || "00:00"}`);
      return inicio >= agora && ["agendado", "confirmado"].includes(ag.status);
    });
    setProximos(filtrados);
  }, []);

  useEffect(() => {
    void (async () => {
      await carregarDashboard();
    })();
  }, [carregarDashboard]);

  useEffect(() => {
    void (async () => {
      await carregarProximos();
    })();
  }, [carregarProximos]);

  const resumo = data?.resumo || {};
  const servicos = data?.servicos || [];
  const seriesMensal = useMemo(() => data?.series_mensal || [], [data]);
  const indicadores = data?.indicadores || {};

  const trendData = useMemo(() => {
    if (!seriesMensal.length) return { monthTrend: null, yearTrend: null };
    const currentMonth = seriesMensal.find((s) => Number(s.mes) === mes);
    const prevMonth = seriesMensal.find((s) => Number(s.mes) === mes - 1);
    const currentValue = Number(currentMonth?.faturamento || 0);
    const prevValue = Number(prevMonth?.faturamento || 0);
    const monthTrend = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : null;
    return { monthTrend, currentValue, prevValue };
  }, [seriesMensal, mes]);

  const periodoLabel = {
    dia: { revenue: t("dashboard.dayRevenue"), appointments: t("dashboard.dayAppointments") },
    semana: { revenue: t("dashboard.weekRevenue"), appointments: t("dashboard.weekAppointments") },
    mes: { revenue: t("dashboard.monthRevenue"), appointments: t("dashboard.monthAppointments") },
  }[periodo];

  const mesesLabels = [
    t("common.month_jan"), t("common.month_feb"), t("common.month_mar"),
    t("common.month_apr"), t("common.month_may"), t("common.month_jun"),
    t("common.month_jul"), t("common.month_aug"), t("common.month_sep"),
    t("common.month_oct"), t("common.month_nov"), t("common.month_dec"),
  ];
  const monthShortLabels = [
    t("common.month_jan_short"), t("common.month_feb_short"), t("common.month_mar_short"),
    t("common.month_apr_short"), t("common.month_may_short"), t("common.month_jun_short"),
    t("common.month_jul_short"), t("common.month_aug_short"), t("common.month_sep_short"),
    t("common.month_oct_short"), t("common.month_nov_short"), t("common.month_dec_short"),
  ];

  function exportarCsv() {
    const linhas = [
      ["Tipo", "Campo", "Valor"],
      ["Resumo", "Mês", String(mes)],
      ["Resumo", "Ano", String(ano)],
      ["Resumo", "Faturamento", formatCurrency(resumo.faturamento)],
      ["Resumo", t("dashboard.todayRevenue"), formatCurrency(resumo.faturamento_dia)],
      ["Resumo", t("dashboard.yearRevenue"), formatCurrency(resumo.faturamento_ano)],
      ["Resumo", t("dashboard.monthAppointments"), String(resumo.total_agendamentos || 0)],
      ["", "", ""],
      ["Tipo", "Nome", "Quantidade"],
      ...servicos.map((s) => ["Serviço", s.nome, String(s.quantidade)]),
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${ano}-${String(mes).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AgendamentoModal
        open={agendamentoModalOpen}
        onClose={() => setAgendamentoModalOpen(false)}
        onSaved={() => { setAgendamentoModalOpen(false); carregarProximos(); }}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-surface-secondary">
            {[
              { key: "dia", label: t("dashboard.periodDay") },
              { key: "semana", label: t("dashboard.periodWeek") },
              { key: "mes", label: t("dashboard.periodMonth") },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriodo(p.key)}
                className={`px-3 py-2 text-xs font-medium transition-all ${periodo === p.key ? "bg-primary text-white" : "text-text-secondary hover:text-text"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodo === "dia" && (
            <div className="flex items-center gap-2">
              <button onClick={() => setDataRef(addDays(dataRef, -1))} className="btn-ghost btn-icon text-base leading-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} className="input text-sm py-2" />
              <button onClick={() => setDataRef(addDays(dataRef, 1))} className="btn-ghost btn-icon text-base leading-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          {periodo === "semana" && (
            <div className="flex items-center gap-2">
              <button onClick={() => setDataRef(addDays(dataRef, -7))} className="btn-ghost btn-icon text-base leading-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} className="input text-sm py-2" />
              <button onClick={() => setDataRef(addDays(dataRef, 7))} className="btn-ghost btn-icon text-base leading-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <span className="text-xs text-text-tertiary whitespace-nowrap">
                {formatDateBR(mondayOf(dataRef))} – {formatDateBR(addDays(mondayOf(dataRef), 6))}
              </span>
            </div>
          )}

          {periodo === "mes" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="select pr-8 py-2 text-sm min-w-[140px]">
                  {mesesLabels.map((label, i) => (
                    <option key={i + 1} value={i + 1}>{label}</option>
                  ))}
                </select>
              </div>
              <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="input w-24 text-sm" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAgendamentoModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("dashboard.newAppointment")}
          </button>
          <button type="button" onClick={exportarCsv} className="btn-ghost text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("dashboard.exportCsv")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label={periodoLabel.revenue}
          value={resumo.faturamento}
          trend={periodo === "mes" ? trendData.monthTrend : undefined}
          icon={kpiIcons.revenue}
          accent="bg-primary-light text-primary"
          cardAccent="card-accent-primary"
        />
        <KpiCard
          label={t("dashboard.weekRevenue")}
          value={resumo.faturamento_semana}
          icon={kpiIcons.revenue}
          accent="bg-warning-light text-warning"
          cardAccent="card-accent-warning"
        />
        <KpiCard
          label={t("dashboard.todayRevenue")}
          value={resumo.faturamento_dia}
          icon={kpiIcons.revenue}
          accent="bg-success-light text-success"
          cardAccent="card-accent-success"
        />
        <KpiCard
          label={t("dashboard.yearRevenue")}
          value={resumo.faturamento_ano}
          icon={kpiIcons.revenue}
          accent="bg-info-light text-info"
          cardAccent="card-accent-info"
        />
        <KpiCard
          label={periodoLabel.appointments}
          value={resumo.total_agendamentos || 0}
          prefix=""
          icon={kpiIcons.appointments}
          accent="bg-accent-light text-accent"
          cardAccent="card-accent-accent"
        />
        <KpiCard
          label={t("dashboard.aReceber")}
          value={resumo.a_receber}
          icon={kpiIcons.pending}
          accent="bg-info-light text-info"
          cardAccent="card-accent-info"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ClockCard />
        <WeatherCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label={t("dashboard.topService")} value={indicadores.servico_mais_vendido || "—"} prefix="" icon={kpiIcons.service} cardAccent="card-accent-primary" />
        <KpiCard label={t("dashboard.topClient")} value={indicadores.cliente_que_mais_agendou || "—"} prefix="" icon={kpiIcons.star} cardAccent="card-accent-accent" />
        <KpiCard label={t("dashboard.averageTicket")} value={indicadores.ticket_medio} icon={kpiIcons.ticket} cardAccent="card-accent-warning" />
        <KpiCard label={t("dashboard.totalClients")} value={indicadores.total_clientes || 0} prefix="" icon={kpiIcons.clients} cardAccent="card-accent-success" />
        <KpiCard label={t("dashboard.activeBarbers")} value={indicadores.total_barbeiros_ativos || 0} prefix="" icon={kpiIcons.barbers} cardAccent="card-accent-info" />
        <KpiCard label={t("dashboard.completedServices")} value={indicadores.total_atendimentos_concluidos || 0} prefix="" icon={kpiIcons.service} cardAccent="card-accent-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text tracking-tight">{t("dashboard.monthlyRevenue")}</h2>
            <span className="text-xs text-text-tertiary">{ano}</span>
          </div>
          <RevenueChart data={seriesMensal} year={ano} monthLabels={monthShortLabels} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text tracking-tight">{t("dashboard.topServices")}</h2>
          </div>
          {servicos.length > 0 ? (
            <div className="space-y-2">
              {servicos.slice(0, 5).map((servico) => {
                const maxQty = Math.max(...servicos.map((s) => s.quantidade), 1);
                const pct = (servico.quantidade / maxQty) * 100;
                return (
                  <div key={servico.nome}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text truncate">{servico.nome}</span>
                      <span className="text-text-secondary font-medium">{servico.quantidade}x</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary py-8 text-center">{t("charts.noServices")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text tracking-tight">{t("dashboard.revenueComparison")}</h2>
          </div>
          <ComparisonChart
            data={[
              { label: t("dashboard.monthRevenue"), value: Number(resumo.faturamento || 0) },
              { label: t("dashboard.todayRevenue"), value: Number(resumo.faturamento_dia || 0) },
              { label: t("dashboard.yearRevenue"), value: Number(resumo.faturamento_ano || 0) },
            ]}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text tracking-tight">{t("agendamentos.nextAppointments")}</h2>
          </div>
          {proximos.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {proximos.slice(0, 10).map((ag) => (
                <div key={ag.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-tertiary transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ag.status === "confirmado" ? "bg-warning" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">{ag.cliente}</p>
                    <p className="text-xs text-text-tertiary">
                      {formatDateBR(ag.data)} às {formatTime(ag.horario)}
                    </p>
                    <p className="text-xs text-text-tertiary">{ag.barbeiro}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusClass(ag.status)}`}>
                    {statusLabel(ag.status, t)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary py-8 text-center">{t("charts.noData")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
