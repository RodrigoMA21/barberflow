import { useEffect, useState } from "react";

function Dashboard() {
  const [resumo, setResumo] = useState({
    faturamento: 0,
    total_agendamentos: 0,
  });

  const [servicos, setServicos] = useState([]);

  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const [ano, setAno] = useState(new Date().getFullYear());

  async function carregarDashboard() {
    const response = await fetch(
      `http://localhost:3000/dashboard?mes=${mes}&ano=${ano}`,
    );

    const data = await response.json();

    setResumo(data.resumo);
    setServicos(data.servicos);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="1">Janeiro</option>
          <option value="2">Fevereiro</option>
          <option value="3">Março</option>
          <option value="4">Abril</option>
          <option value="5">Maio</option>
          <option value="6">Junho</option>
          <option value="7">Julho</option>
          <option value="8">Agosto</option>
          <option value="9">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>

        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="border p-2 rounded w-32"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Faturamento Total</h2>

          <p className="text-3xl font-bold mt-2">
            R$ {Number(resumo.faturamento).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Total de Agendamentos</h2>

          <p className="text-3xl font-bold mt-2">{resumo.total_agendamentos}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Serviços Mais Realizados</h2>

        <div className="space-y-3">
          {servicos.map((servico) => (
            <div
              key={servico.nome}
              className="flex justify-between border-b pb-2"
            >
              <span>{servico.nome}</span>

              <span>{servico.quantidade}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
