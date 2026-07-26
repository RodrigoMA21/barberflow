import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ThemeToggle from "./ui/ThemeToggle";

const pageIcons = {
  "/": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "/clientes": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "/servicos": "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  "/barbeiros": "M4 8c0 3 1.5 5 4 5 2.5 0 3-2.5 4-2.5s1.5 2.5 4 2.5c2.5 0 4-2 4-5",
  "/agenda": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "/agendamentos": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "/historico": "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  const titles = {
    "/": t("nav.dashboard"),
    "/clientes": t("nav.clientes"),
    "/servicos": t("nav.servicos"),
    "/barbeiros": t("nav.barbeiros"),
    "/agenda": t("nav.agenda"),
    "/agendamentos": t("nav.agendamentos"),
    "/historico": t("nav.historico"),
  };

  const currentIcon = pageIcons[location.pathname] || pageIcons["/"];

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-light text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={currentIcon} />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text">
            {titles[location.pathname] || t("nav.dashboard")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Header;
