import { useLocation, useNavigate } from "react-router-dom";

const HEADER_TITLES = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/servicos": "Serviços",
  "/agendamentos": "Agendamentos",
  "/agenda": "Agenda",
  "/barbeiros": "Barbeiros",
  "/historico": "Histórico",
};

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const title = HEADER_TITLES[location.pathname] || "BarberFlow";

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  function fazerLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        <span className="font-medium">
          {usuario?.nome || "Usuário"}
        </span>

        <button
          type="button"
          onClick={fazerLogout}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;
