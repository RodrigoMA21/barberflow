import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl shadow-dropdown px-3 py-2 text-sm">
      <p className="font-semibold text-text mb-1">{label}</p>
      <p className="text-text-secondary">R$ {Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

export default function ComparisonChart({ data = [] }) {
  const { t } = useTranslation();
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-text-tertiary">
        {t("charts.noData")}
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, maxValue * 1.15]}
            tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-tertiary)" }} />
          <Bar
            dataKey="value"
            fill="var(--color-primary)"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
