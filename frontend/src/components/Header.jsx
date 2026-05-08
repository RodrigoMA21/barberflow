import { useLocation } from "react-router-dom";

function Header() {
  const location = useLocation();

  const titles = {
    "/": "Dashboard",
    "/clientes": "Clientes",
    "/servicos": "Serviços",
    "/agendamentos": "Agendamentos",
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{titles[location.pathname]}</h1>

      <div>
        <span className="font-medium">Administrador</span>
      </div>
    </header>
  );
}

export default Header;
