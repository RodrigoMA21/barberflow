import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl shadow-dropdown px-3 py-2 text-sm">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-text-secondary">
          {entry.name}: R$ {Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ data = [], year, monthLabels }) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const labels = monthLabels || [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return labels.map((label, i) => {
      const month = i + 1;
      const item = data.find((d) => Number(d.mes) === month);
      return {
        name: label,
        Faturamento: Number(item?.faturamento || 0),
      };
    });
  }, [data]);

  const maxValue = Math.max(...chartData.map((d) => d.Faturamento), 0);

  if (chartData.every((d) => d.Faturamento === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-tertiary">
        {t("charts.noDataYear", { year })}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : Math.round(v)}`}
            domain={[0, maxValue * 1.15]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-tertiary)" }} />
          <Bar
            dataKey="Faturamento"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
