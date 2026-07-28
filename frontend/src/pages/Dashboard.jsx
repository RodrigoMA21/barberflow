import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import ComparisonChart from "../components/charts/ComparisonChart";
import RevenueChart from "../components/charts/RevenueChart";

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
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
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const { t } = useTranslation();

  async function carregarDashboard() {
    const response = await api(`/dashboard?mes=${mes}&ano=${ano}`);
    if (!response.ok) {
      setData(null);
      return;
    }
    const d = await response.json();
    setData(d);
  }

  useEffect(() => {
    carregarDashboard();
  }, [mes, ano]);

  const resumo = data?.resumo || {};
  const servicos = data?.servicos || [];
  const seriesMensal = data?.series_mensal || [];
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

  const mesesLabels = [
    t("common.month_jan"), t("common.month_feb"), t("common.month_mar"),
    t("common.month_apr"), t("common.month_may"), t("common.month_jun"),
    t("common.month_jul"), t("common.month_aug"), t("common.month_sep"),
    t("common.month_oct"), t("common.month_nov"), t("common.month_dec"),
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="select pr-8 py-2 text-sm min-w-[140px]">
              {mesesLabels.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
          </div>
          <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="input w-24 text-sm" />
        </div>
        <button type="button" onClick={exportarCsv} className="btn-ghost text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t("dashboard.exportCsv")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label={t("dashboard.monthRevenue")}
          value={resumo.faturamento}
          trend={trendData.monthTrend}
          icon={kpiIcons.revenue}
          accent="bg-primary-light text-primary"
          cardAccent="card-accent-primary"
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
          label={t("dashboard.monthAppointments")}
          value={resumo.total_agendamentos || 0}
          prefix=""
          icon={kpiIcons.appointments}
          accent="bg-accent-light text-accent"
          cardAccent="card-accent-accent"
        />
        <KpiCard
          label={t("dashboard.yearAppointments")}
          value={resumo.total_agendamentos_ano || 0}
          prefix=""
          icon={kpiIcons.appointments}
          accent="bg-warning-light text-warning"
          cardAccent="card-accent-warning"
        />
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
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">{t("dashboard.monthlyRevenue")}</h2>
            <span className="text-xs text-text-tertiary">{ano}</span>
          </div>
          <RevenueChart data={seriesMensal} year={ano} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">{t("dashboard.topServices")}</h2>
          </div>
          {servicos.length > 0 ? (
            <div className="space-y-2">
              {servicos.slice(0, 5).map((servico, i) => {
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
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text">{t("dashboard.revenueComparison")}</h2>
          </div>
          <ComparisonChart
            data={[
              { label: t("dashboard.monthRevenue"), value: Number(resumo.faturamento || 0) },
              { label: t("dashboard.todayRevenue"), value: Number(resumo.faturamento_dia || 0) },
              { label: t("dashboard.yearRevenue"), value: Number(resumo.faturamento_ano || 0) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
