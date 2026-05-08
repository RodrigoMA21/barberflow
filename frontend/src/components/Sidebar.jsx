function Sidebar() {
  return (
    <aside className="w-64 bg-black text-white p-6">
      <h2 className="text-2xl font-bold mb-10">BarberFlow</h2>

      <nav className="flex flex-col gap-4">
        <button className="text-left hover:text-gray-400">Dashboard</button>

        <button className="text-left hover:text-gray-400">Clientes</button>

        <button className="text-left hover:text-gray-400">Serviços</button>

        <button className="text-left hover:text-gray-400">Agendamentos</button>
      </nav>
    </aside>
  );
}

export default Sidebar;
