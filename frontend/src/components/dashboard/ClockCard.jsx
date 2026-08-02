import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function getLocale(language) {
  const lang = language || "pt";
  if (lang.startsWith("pt")) return "pt-BR";
  if (lang.startsWith("es")) return "es";
  return "en";
}

export default function ClockCard() {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = getLocale(i18n.language);
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="card p-6 flex flex-col justify-center card-accent-primary animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </div>
        <span className="text-sm font-medium text-text-secondary">{t("dashboard.clock")}</span>
      </div>
      <p className="text-4xl font-bold text-text tracking-tight tabular-nums leading-none">{time}</p>
      <p className="text-sm text-text-secondary mt-2 capitalize">{date}</p>
    </div>
  );
}
