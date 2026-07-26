import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-brand-700)",
  "var(--color-brand-500)",
  "var(--color-brand-300)",
  "var(--color-brand-800)",
  "var(--color-brand-600)",
  "var(--color-brand-400)",
];

function CustomTooltip({ active, payload }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-surface border border-border rounded-xl shadow-dropdown px-3 py-2 text-sm">
      <p className="font-semibold text-text">{d.name}</p>
      <p className="text-text-secondary">{t("charts.timesPerformed", { count: d.value })}</p>
    </div>
  );
}

export default function ServicesPieChart({ data = [] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
        {t("charts.noServices")}
      </div>
    );
  }

  return (
    <div className="h-48 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="quantidade"
            nameKey="nome"
            cx="50%"
            cy="50%"
            outerRadius={70}
            innerRadius={40}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 text-xs shrink-0">
        {data.slice(0, 5).map((item, i) => (
          <div key={item.nome} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-text-secondary truncate max-w-[100px]">{item.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
