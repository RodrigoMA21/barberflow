import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ThemeToggle from "./ui/ThemeToggle";

function Header({ onMenuClick }) {
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

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="!sm:hidden btn-ghost btn-icon shrink-0"
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-text truncate">
            {titles[location.pathname] || t("nav.dashboard")}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Header;
