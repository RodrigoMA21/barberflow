import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="w-64 bg-black text-white p-6">
      <h2 className="text-2xl font-bold mb-10">{t("sidebar.title")}</h2>

      <nav className="flex flex-col gap-4">
        <Link to="/" className="hover:text-gray-400">
          {t("nav.dashboard")}
        </Link>

        <Link to="/clientes" className="hover:text-gray-400">
          {t("nav.clientes")}
        </Link>

        <Link to="/servicos" className="hover:text-gray-400">
          {t("nav.servicos")}
        </Link>

        <Link to="/barbeiros" className="hover:text-gray-400">
          {t("nav.barbeiros")}
        </Link>

        <Link to="/agenda" className="hover:text-gray-400">
          {t("nav.agenda")}
        </Link>

        <Link to="/agendamentos" className="hover:text-gray-400">
          {t("nav.agendamentos")}
        </Link>

        <Link to="/historico" className="hover:text-gray-400">
          {t("nav.historico")}
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
