import { useEffect, useState } from "react";

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [servicoIds, setServicoIds] = useState([]);

  const [editingId, setEditingId] = useState(null);

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
      servico_ids: servicoIds,
      data,
      horario,
    };

    let response;

    if (editingId) {
      response = await fetch(
        `http://localhost:3000/agendamentos/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoAgendamento),
        },
      );
    } else {
      response = await fetch("http://localhost:3000/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAgendamento),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Erro ao salvar agendamento");
      return;
    }

    // reset
    setClienteId("");
    setServicoIds([]);
    setData("");
    setHorario("");
    setEditingId(null);

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
          <label className="block mb-1">Serviços</label>

          <div className="border p-3 rounded space-y-2">
            {servicos.map((servico) => (
              <label key={servico.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={servicoIds.includes(String(servico.id))}
                  onChange={(e) => {
                    const id = String(servico.id);
                    setServicoIds(
                      e.target.checked
                        ? [...servicoIds, id]
                        : servicoIds.filter((s) => s !== id),
                    );
                  }}
                  className="w-4 h-4"
                />
                <span>
                  {servico.nome} - R$ {Number(servico.preco).toFixed(2)}
                </span>
              </label>
            ))}
          </div>
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

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded"
          >
            {editingId ? "Salvar" : "Agendar"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setClienteId("");
                setServicoIds([]);
                setData("");
                setHorario("");
              }}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {agendamentos.map((agendamento) => (
          <div key={agendamento.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{agendamento.cliente}</h2>

            <p>
              Serviços:{" "}
              {agendamento.servicos && agendamento.servicos.length > 0
                ? agendamento.servicos.map((s) => s.nome).join(", ")
                : "—"}
            </p>

            <p>Valor: R$ {Number(agendamento.total).toFixed(2)}</p>

            <p>Data: {formatDateBR(agendamento.data)}</p>

            <p>Horário: {String(agendamento.horario).slice(0, 5)}</p>

            <div className="mt-3 space-x-2">
              <button
                onClick={() => {
                  // iniciar edição
                  setEditingId(agendamento.id);
                  setClienteId(
                    agendamento.cliente_id
                      ? String(agendamento.cliente_id)
                      : "",
                  );
                  setData(
                    agendamento.data ? agendamento.data.split("T")[0] : "",
                  );
                  setHorario(agendamento.horario || "");
                  setServicoIds(
                    agendamento.servicos
                      ? agendamento.servicos.map((s) => String(s.id))
                      : [],
                  );
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Editar
              </button>

              <button
                onClick={() => deletarAgendamento(agendamento.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Agendamentos;
