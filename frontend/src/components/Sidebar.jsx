import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-black text-white p-6">
      <h2 className="text-2xl font-bold mb-10">BarberFlow</h2>

      <nav className="flex flex-col gap-4">
        <Link to="/" className="hover:text-gray-400">
          Dashboard
        </Link>

        <Link to="/clientes" className="hover:text-gray-400">
          Clientes
        </Link>

        <Link to="/servicos" className="hover:text-gray-400">
          Serviços
        </Link>

        <Link to="/barbeiros" className="hover:text-gray-400">
          Barbeiros
        </Link>

        <Link to="/agenda" className="hover:text-gray-400">
          Agenda
        </Link>

        <Link to="/agendamentos" className="hover:text-gray-400">
          Agendamentos
        </Link>

        <Link to="/historico" className="hover:text-gray-400">
          Histórico
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
