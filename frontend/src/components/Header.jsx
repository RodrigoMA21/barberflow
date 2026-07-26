import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{titles[location.pathname] || t("nav.dashboard")}</h1>

      <div>
        <span className="font-medium">{t("header.admin")}</span>
      </div>
    </header>
  );
}

export default Header;
