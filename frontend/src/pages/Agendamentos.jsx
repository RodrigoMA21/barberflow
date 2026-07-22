import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time, minutes) {
  const total = toMinutes(time) + Number(minutes || 0);
  const hours = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mins = String(total % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function statusLabel(status) {
  const map = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
    nao_compareceu: "Não compareceu",
  };

  return map[status] || status || "Agendado";
}

function statusClass(status) {
  const map = {
    agendado: "bg-blue-100 text-blue-700",
    confirmado: "bg-amber-100 text-amber-700",
    concluido: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
    nao_compareceu: "bg-gray-200 text-gray-700",
  };

  return map[status] || "bg-gray-200 text-gray-700";
}

function Agendamentos() {
  const [searchParams] = useSearchParams();
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [servicoIds, setServicoIds] = useState([]);
  const [status, setStatus] = useState("agendado");
  const [descontoValor, setDescontoValor] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");

  async function carregarAgendamentos() {
    const response = await fetch("http://localhost:3000/agendamentos");
    const responseData = await response.json();
    setAgendamentos(responseData);
  }

  async function carregarClientes() {
    const response = await fetch("http://localhost:3000/clientes");
    const responseData = await response.json();
    setClientes(responseData);
  }

  async function carregarServicos() {
    const response = await fetch("http://localhost:3000/servicos");
    const responseData = await response.json();
    setServicos(responseData);
  }

  async function carregarBarbeiros() {
    const response = await fetch("http://localhost:3000/barbeiros");
    const responseData = await response.json();
    setBarbeiros(responseData.filter((barbeiro) => barbeiro.ativo));
  }

  useEffect(() => {
    carregarAgendamentos();
    carregarClientes();
    carregarServicos();
    carregarBarbeiros();
  }, []);

  useEffect(() => {
    if (agendamentos.length === 0) return;

    const editId = searchParams.get("edit");
    const dataParam = searchParams.get("data");
    const horarioParam = searchParams.get("horario");
    const barbeiroParam = searchParams.get("barbeiro_id");
    const clienteParam = searchParams.get("cliente_id");

    if (editId) {
      const agendamento = agendamentos.find((item) => String(item.id) === editId);

      if (agendamento && String(editingId || "") !== editId) {
        iniciarEdicao(agendamento);
      }

      return;
    }

    if (!editingId && (dataParam || horarioParam || barbeiroParam || clienteParam)) {
      if (dataParam) setData(dataParam);
      if (horarioParam) setHorario(horarioParam);
      if (barbeiroParam) setBarbeiroId(barbeiroParam);
      if (clienteParam) setClienteId(clienteParam);
      setStatus("agendado");
    }
  }, [agendamentos, editingId, searchParams]);

  const servicosSelecionados = useMemo(
    () => servicos.filter((servico) => servicoIds.includes(String(servico.id))),
    [servicos, servicoIds],
  );

  const duracaoTotalMinutos = useMemo(
    () =>
      servicosSelecionados.reduce(
        (total, servico) => total + Number(servico.duracao_minutos || 30),
        0,
      ),
    [servicosSelecionados],
  );

  const valorBruto = useMemo(
    () =>
      servicosSelecionados.reduce(
        (total, servico) => total + Number(servico.preco || 0),
        0,
      ),
    [servicosSelecionados],
  );

  const valorFinalCalculado = useMemo(() => {
    if (valorFinal !== "") {
      return Math.max(Number(valorFinal) || 0, 0);
    }

    return Math.max(valorBruto - (Number(descontoValor) || 0), 0);
  }, [descontoValor, valorBruto, valorFinal]);

  const terminoPrevisto = useMemo(() => {
    if (!horario || !duracaoTotalMinutos) return "";
    return addMinutesToTime(horario, duracaoTotalMinutos);
  }, [horario, duracaoTotalMinutos]);

  async function criarAgendamento(e) {
    e.preventDefault();

    const novoAgendamento = {
      cliente_id: clienteId,
      barbeiro_id: barbeiroId,
      servico_ids: servicoIds,
      data,
      horario,
      status,
      desconto_valor: descontoValor === "" ? 0 : Number(descontoValor),
      valor_final: valorFinal === "" ? null : Number(valorFinal),
    };

    const response = editingId
      ? await fetch(`http://localhost:3000/agendamentos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoAgendamento),
        })
      : await fetch("http://localhost:3000/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoAgendamento),
        });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Erro ao salvar agendamento");
      return;
    }

    setClienteId("");
    setBarbeiroId("");
    setServicoIds([]);
    setData("");
    setHorario("");
    setStatus("agendado");
    setDescontoValor("");
    setValorFinal("");
    setEditingId(null);

    carregarAgendamentos();
  }

  async function deletarAgendamento(id) {
    const confirmar = window.confirm("Tem certeza que deseja deletar este agendamento?");

    if (!confirmar) return;

    await fetch(`http://localhost:3000/agendamentos/${id}`, { method: "DELETE" });
    carregarAgendamentos();
  }

  async function atualizarStatusAgendamento(id, novoStatus) {
    const response = await fetch(`http://localhost:3000/agendamentos/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: novoStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Erro ao atualizar status");
      return;
    }

    carregarAgendamentos();
  }

  async function registrarNoCartaoFidelidade(agendamento, observacao = "Atendimento concluído") {
    if (!agendamento.cliente_id) return;

    const response = await fetch(
      `http://localhost:3000/clientes/${agendamento.cliente_id}/cartao-fidelidade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data_atendimento: agendamento.data ? agendamento.data.split("T")[0] : new Date().toISOString().split("T")[0],
          observacao,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Erro ao registrar no cartão fidelidade");
    }
  }

  async function concluirAgendamento(agendamento) {
    const response = await fetch(`http://localhost:3000/agendamentos/${agendamento.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "concluido" }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Erro ao concluir agendamento");
      return;
    }

    await registrarNoCartaoFidelidade(agendamento);
    carregarAgendamentos();
  }

  function iniciarEdicao(agendamento) {
    setEditingId(agendamento.id);
    setClienteId(agendamento.cliente_id ? String(agendamento.cliente_id) : "");
    setBarbeiroId(agendamento.barbeiro_id ? String(agendamento.barbeiro_id) : "");
    setData(agendamento.data ? agendamento.data.split("T")[0] : "");
    setHorario(agendamento.horario || "");
    setServicoIds(
      agendamento.servicos ? agendamento.servicos.map((servico) => String(servico.id)) : [],
    );
    setStatus(agendamento.status || "agendado");
    setDescontoValor(agendamento.desconto_valor ?? "");
    setValorFinal(agendamento.valor_final ?? "");
  }

  function limparFormulario() {
    setEditingId(null);
    setClienteId("");
    setBarbeiroId("");
    setServicoIds([]);
    setData("");
    setHorario("");
    setStatus("agendado");
    setDescontoValor("");
    setValorFinal("");
  }

  const agora = new Date();

  const proximos = agendamentos.filter((agendamento) => {
    const inicio = agendamento.inicio_em
      ? new Date(agendamento.inicio_em)
      : new Date(`${agendamento.data}T${agendamento.horario || "00:00"}`);
    return inicio >= agora && ["agendado", "confirmado"].includes(agendamento.status);
  });

  return (
    <div>
      <form onSubmit={criarAgendamento} className="bg-white p-6 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Barbeiro</label>
            <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Selecione um barbeiro</option>
              {barbeiros.map((barbeiro) => (
                <option key={barbeiro.id} value={barbeiro.id}>
                  {barbeiro.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block mb-1">Horário de início</label>
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-2 rounded">
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
              <option value="nao_compareceu">Não compareceu</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Desconto (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={descontoValor}
              onChange={(e) => setDescontoValor(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Valor final (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="mb-4 mt-4">
          <label className="block mb-1">Serviços</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {servicos.map((servico) => {
              const selected = servicoIds.includes(String(servico.id));

              return (
                <button
                  type="button"
                  key={servico.id}
                  onClick={() => {
                    const id = String(servico.id);
                    setServicoIds(
                      selected
                        ? servicoIds.filter((s) => s !== id)
                        : [...servicoIds, id],
                    );
                  }}
                  className={`text-left rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    selected
                      ? "border-black bg-gray-100 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm">{servico.nome}</span>
                    {selected && (
                      <span className="text-black text-lg leading-none shrink-0">✓</span>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-500 space-y-0.5">
                    <div>
                      R$ {Number(servico.preco).toFixed(2)}
                    </div>

                    <div>
                      {servico.duracao_minutos || 30} min
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="block text-gray-500">Horário de início</span>
            <strong>{data && horario ? `${formatDateBR(data)} ${formatTime(horario)}` : "Selecione a data e hora"}</strong>
          </div>

          <div>
            <span className="block text-gray-500">Horário previsto de término</span>
            <strong>{terminoPrevisto ? `${formatDateBR(data)} ${terminoPrevisto}` : "Selecione os serviços"}</strong>
          </div>

          <div>
            <span className="block text-gray-500">Tempo total do atendimento</span>
            <strong>{duracaoTotalMinutos ? `${duracaoTotalMinutos} min` : "0 min"}</strong>
          </div>

          <div>
            <span className="block text-gray-500">Valor a faturar</span>
            <strong>R$ {valorFinalCalculado.toFixed(2)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">
            {editingId ? "Salvar" : "Agendar"}
          </button>

          {editingId && (
            <button type="button" onClick={limparFormulario} className="bg-gray-300 text-black px-4 py-2 rounded">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-2xl font-semibold">Próximos agendamentos</h3>

            <p className="text-sm text-gray-500">
              Para histórico e edição de meses anteriores, use a aba Histórico.
            </p>
          </div>

          <div className="space-y-4">
            {proximos.map((agendamento) => (
              <div key={agendamento.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{agendamento.cliente}</h2>
                    <p className="text-sm text-gray-500">{agendamento.barbeiro || "Sem barbeiro"}</p>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded-full ${statusClass(agendamento.status)}`}>
                    {statusLabel(agendamento.status)}
                  </span>
                </div>

                <p>Serviços: {agendamento.servicos && agendamento.servicos.length > 0 ? agendamento.servicos.map((s) => s.nome).join(", ") : "—"}</p>
                <p>Duração: {agendamento.duracao_total_minutos || 0} min</p>
                <p>Início: {formatDateBR(agendamento.data)} {formatTime(agendamento.horario)}</p>
                <p>Término: {formatDateBR(agendamento.data)} {formatTime(agendamento.termino_em || addMinutesToTime(agendamento.horario, agendamento.duracao_total_minutos))}</p>
                <p>Valor bruto: R$ {Number(agendamento.total_bruto || 0).toFixed(2)}</p>
                <p>Desconto: R$ {Number(agendamento.desconto_valor || 0).toFixed(2)}</p>
                <p>Valor final: R$ {Number(agendamento.total || 0).toFixed(2)}</p>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {agendamento.status === "agendado" && (
                    <button
                      onClick={() => atualizarStatusAgendamento(agendamento.id, "confirmado")}
                      className="bg-emerald-600 text-white px-4 py-2 rounded"
                    >
                      Confirmar
                    </button>
                  )}

                  {agendamento.status === "confirmado" && (
                    <button
                      onClick={() => concluirAgendamento(agendamento)}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Concluir
                    </button>
                  )}

                  <button onClick={() => iniciarEdicao(agendamento)} className="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                  <button onClick={() => deletarAgendamento(agendamento.id)} className="bg-red-500 text-white px-4 py-2 rounded">Deletar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default Agendamentos;
