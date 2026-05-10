import { useEffect, useState } from "react";

function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  async function carregarAgendamentos() {
    const response = await fetch("http://localhost:3000/agendamentos");

    const data = await response.json();

    setAgendamentos(data);
  }

  async function carregarClientes() {
    const response = await fetch("http://localhost:3000/clientes");

    const data = await response.json();

    setClientes(data);
  }

  async function carregarServicos() {
    const response = await fetch("http://localhost:3000/servicos");

    const data = await response.json();

    setServicos(data);
  }

  useEffect(() => {
    carregarAgendamentos();
    carregarClientes();
    carregarServicos();
  }, []);

  async function criarAgendamento(e) {
    e.preventDefault();

    const novoAgendamento = {
      cliente_id: clienteId,
      servico_id: servicoId,
      data,
      horario,
    };

    await fetch("http://localhost:3000/agendamentos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novoAgendamento),
    });

    setClienteId("");
    setServicoId("");
    setData("");
    setHorario("");

    carregarAgendamentos();
  }

  async function deletarAgendamento(id) {
    const confirmar = confirm(
      "Tem certeza que deseja deletar este agendamento?",
    );

    if (!confirmar) return;

    await fetch(`http://localhost:3000/agendamentos/${id}`, {
      method: "DELETE",
    });

    carregarAgendamentos();
  }

  return (
    <div>
      <form
        onSubmit={criarAgendamento}
        className="bg-white p-6 rounded shadow mb-6"
      >
        <div className="mb-4">
          <label className="block mb-1">Cliente</label>

          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Selecione um cliente</option>

            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Serviço</label>

          <select
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Selecione um serviço</option>

            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome} - R$ {Number(servico.preco).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Data</label>

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Horário</label>

          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Agendar
        </button>
      </form>

      <div className="space-y-4">
        {agendamentos.map((agendamento) => (
          <div key={agendamento.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{agendamento.cliente}</h2>

            <p>Serviço: {agendamento.servico}</p>

            <p>Valor: R$ {Number(agendamento.preco).toFixed(2)}</p>

            <p>Data: {agendamento.data}</p>

            <p>Horário: {agendamento.horario}</p>

            <button
              onClick={() => deletarAgendamento(agendamento.id)}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
            >
              Deletar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Agendamentos;
