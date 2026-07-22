import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import AgendamentoModal from "../components/AgendamentoModal";

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function getDayName(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

function timeStringToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getBusinessSlots(dateValue, barbeiro) {
  const slots = [];
  const dias = Array.isArray(barbeiro?.dias_atendimento) ? barbeiro.dias_atendimento.map(Number) : [];
  const inicio = timeStringToMinutes(barbeiro?.horario_inicio);
  const fim = timeStringToMinutes(barbeiro?.horario_fim);
  const intervaloInicio = timeStringToMinutes(barbeiro?.horario_intervalo_inicio);
  const intervaloFim = timeStringToMinutes(barbeiro?.horario_intervalo_fim);
  const diaSelecionado = new Date(`${dateValue}T12:00:00`).getDay();

  if (dias.length > 0 && !dias.includes(diaSelecionado)) {
    return [];
  }

  if (inicio === null || fim === null) {
    for (let current = 0; current < 24 * 60; current += 30) {
      slots.push(current);
    }

    return slots;
  }

  const ranges = [];
  if (intervaloInicio !== null && intervaloFim !== null && intervaloFim > intervaloInicio) {
    ranges.push([inicio, intervaloInicio], [intervaloFim, fim]);
  } else {
    ranges.push([inicio, fim]);
  }

  for (const [start, end] of ranges) {
    for (let current = start; current < end; current += 30) {
      slots.push(current);
    }
  }

  return slots;
}

function minutesToLabel(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function formatDaysSummary(diasAtendimento) {
  const daysMap = {
    0: "Dom",
    1: "Seg",
    2: "Ter",
    3: "Qua",
    4: "Qui",
    5: "Sex",
    6: "Sáb",
  };

  const ordered = Array.isArray(diasAtendimento) ? diasAtendimento.map(Number).filter((day) => Number.isInteger(day)).sort((a, b) => a - b) : [];

  if (ordered.length === 0) return "Todos os dias";

  if (ordered.length === 6 && !ordered.includes(0)) return "Seg-Sáb";
  if (ordered.length === 5 && ordered.every((day, index) => day === index + 1)) return "Seg-Sex";
  if (ordered.length === 1) return daysMap[ordered[0]] || "Dia";

  return ordered.map((day) => daysMap[day] || String(day)).join(", ");
}

function formatScheduleSummary(barbeiro) {
  const inicio = barbeiro?.horario_inicio ? String(barbeiro.horario_inicio).slice(0, 5) : "--:--";
  const fim = barbeiro?.horario_fim ? String(barbeiro.horario_fim).slice(0, 5) : "--:--";
  const intervaloInicio = barbeiro?.horario_intervalo_inicio ? String(barbeiro.horario_intervalo_inicio).slice(0, 5) : null;
  const intervaloFim = barbeiro?.horario_intervalo_fim ? String(barbeiro.horario_intervalo_fim).slice(0, 5) : null;

  if (intervaloInicio && intervaloFim) {
    return `${formatDaysSummary(barbeiro.dias_atendimento)} ${inicio}-${fim} / ${intervaloInicio}-${intervaloFim}`;
  }

  return `${formatDaysSummary(barbeiro.dias_atendimento)} ${inicio}-${fim}`;
}

function Agenda() {
  const hoje = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(hoje);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [barbeiros, setBarbeiros] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoInicial, setAgendamentoInicial] = useState(null);
  const notify = useNotify();

  useEffect(() => {
    void (async () => {
      const response = await api("/barbeiros");
      const responseData = await response.json();
      setBarbeiros(responseData.filter((barbeiro) => barbeiro.ativo));
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams({ data });

      if (barbeiroId) params.append("barbeiro_id", barbeiroId);

      const response = await api(
        `/agendamentos/agenda?${params.toString()}`,
      );
      const responseData = await response.json();
      setAgenda(Array.isArray(responseData) ? responseData : []);
    })();
  }, [data, barbeiroId]);

  async function recarregarAgenda() {
    const params = new URLSearchParams({ data });

    if (barbeiroId) params.append("barbeiro_id", barbeiroId);

    const response = await api(`/agendamentos/agenda?${params.toString()}`);
    const responseData = await response.json();
    setAgenda(Array.isArray(responseData) ? responseData : []);
  }

  const agendaPorBarbeiro = useMemo(() => {
    const grouped = new Map();

    for (const barbeiro of barbeiros) {
      grouped.set(String(barbeiro.id), []);
    }

    for (const item of agenda) {
      const key = String(item.barbeiro_id || "");
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }

    return grouped;
  }, [agenda, barbeiros]);

  function slotEstaOcupado(item, slotMinutes) {
    const inicio = item.inicio_em ? new Date(item.inicio_em) : null;
    const termino = item.termino_em ? new Date(item.termino_em) : null;

    if (!inicio || !termino || item.status === "cancelado") return false;

    const slotStart = new Date(`${data}T${minutesToLabel(slotMinutes)}:00`);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

    return inicio < slotEnd && termino > slotStart;
  }

  async function atualizarStatusAgendamento(id, novoStatus) {
    const response = await api(`/agendamentos/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: novoStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao atualizar status");
      return;
    }

    recarregarAgenda();
  }

  async function deletarAgendamento(id) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este agendamento?");

    if (!confirmar) return;

    await api(`/agendamentos/${id}`, { method: "DELETE" });
    recarregarAgenda();
  }

  function agendarHorarioLivre(barbeiro, slotMinutes) {
    const horas = String(Math.floor(slotMinutes / 60)).padStart(2, "0");
    const minutos = String(slotMinutes % 60).padStart(2, "0");
    setAgendamentoInicial({
      data,
      horario: `${horas}:${minutos}`,
      barbeiro_id: String(barbeiro.id),
      status: "agendado",
      cliente_id: "",
      servicos: [],
    });
    setModalAberto(true);
  }

  function editarAgendamento(item) {
    setAgendamentoInicial(item);
    setModalAberto(true);
  }

  async function salvarAgendamento() {
    await recarregarAgenda();
  }

  const barbersToShow = barbeiroId
    ? barbeiros.filter((barbeiro) => String(barbeiro.id) === barbeiroId)
    : barbeiros;

  return (
    <div>
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block mb-1 text-sm text-gray-500">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-500">Barbeiro</label>
          <select
            value={barbeiroId}
            onChange={(e) => setBarbeiroId(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Todos</option>
            {barbeiros.map((barbeiro) => (
              <option key={barbeiro.id} value={barbeiro.id}>
                {barbeiro.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500">{getDayName(data)}</div>
      </div>

      <div className="space-y-4">
        {barbersToShow.length === 0 && !barbeiroId && (
          <div className="bg-white p-6 rounded shadow">
            Nenhum barbeiro ativo cadastrado. Cadastre barbeiros para visualizar a agenda.
          </div>
        )}

        {barbersToShow.map((barbeiro) => {
          const items = agendaPorBarbeiro.get(String(barbeiro.id)) || [];
          const slots = getBusinessSlots(data, barbeiro);

          return (
            <div key={barbeiro.id} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold">{barbeiro.nome}</h2>
                  <p className="text-sm text-gray-500">{barbeiro.especialidade || "Sem especialidade"}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatScheduleSummary(barbeiro)}</p>
                </div>

                <span className="text-sm text-gray-500">{items.length} agendamentos</span>
              </div>

              {slots.length === 0 ? (
                <p className="text-sm text-gray-500">Este barbeiro não atende no dia selecionado.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {slots.map((slotMinutes) => {
                    const ocupados = items.filter((item) => slotEstaOcupado(item, slotMinutes));
                    const ocupado = ocupados.length > 0;
                    const itemPrincipal = ocupados[0];

                    return (
                      <div
                        key={`${barbeiro.id}-${slotMinutes}`}
                        className={`rounded-lg border p-3 flex items-center justify-between ${ocupado ? "bg-black text-white border-black" : "bg-emerald-50 border-emerald-100"}`}
                      >
                        <div>
                          <div className="font-semibold">{minutesToLabel(slotMinutes)}</div>
                          <div className={`text-sm ${ocupado ? "text-gray-200" : "text-gray-600"}`}>
                            {ocupado ? itemPrincipal.cliente : "Livre"}
                          </div>
                          {ocupado && (
                            <div className={`text-xs mt-1 ${ocupado ? "text-gray-300" : "text-gray-500"}`}>
                              {itemPrincipal.servicos?.map((s) => s.nome).join(", ") || "Serviço"}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-sm flex flex-col items-end gap-2">
                          {ocupado ? (
                            <>
                              <div>
                                {formatTime(itemPrincipal.horario)} - {formatTime(itemPrincipal.termino_em)}
                              </div>

                              <div className="flex flex-wrap gap-2 justify-end">
                                {itemPrincipal.status === "agendado" && (
                                  <button
                                    type="button"
                                    onClick={() => atualizarStatusAgendamento(itemPrincipal.id, "confirmado")}
                                    className="bg-amber-500 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Confirmar
                                  </button>
                                )}

                                {itemPrincipal.status === "confirmado" && (
                                  <button
                                    type="button"
                                    onClick={() => atualizarStatusAgendamento(itemPrincipal.id, "concluido")}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Concluir
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => editarAgendamento(itemPrincipal)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deletarAgendamento(itemPrincipal.id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                                >
                                  Excluir
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>Disponível</div>

                              <button
                                type="button"
                                onClick={() => agendarHorarioLivre(barbeiro, slotMinutes)}
                                className="bg-black text-white px-3 py-1 rounded text-xs"
                              >
                                Agendar aqui
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {!barbeiroId && (agendaPorBarbeiro.get("") || []).length > 0 && (
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold">Sem barbeiro</h2>
                <p className="text-sm text-gray-500">Agendamentos sem barbeiro atribuído</p>
              </div>

              <span className="text-sm text-gray-500">
                {(agendaPorBarbeiro.get("") || []).length} agendamentos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(agendaPorBarbeiro.get("") || []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{formatTime(item.horario)}</div>
                    <div className="text-sm text-gray-700">{item.cliente}</div>
                    {item.servicos?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.servicos.map((s) => s.nome).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm flex flex-wrap gap-2 justify-end">
                    {item.status === "agendado" && (
                      <button
                        type="button"
                        onClick={() => atualizarStatusAgendamento(item.id, "confirmado")}
                        className="bg-amber-500 text-white px-3 py-1 rounded text-xs"
                      >
                        Confirmar
                      </button>
                    )}

                    {item.status === "confirmado" && (
                      <button
                        type="button"
                        onClick={() => atualizarStatusAgendamento(item.id, "concluido")}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Concluir
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => editarAgendamento(item)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => deletarAgendamento(item.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AgendamentoModal
        key={`${modalAberto ? "open" : "closed"}-${agendamentoInicial?.id || "new"}-${agendamentoInicial?.data || ""}-${agendamentoInicial?.horario || ""}`}
        open={modalAberto}
        initialData={agendamentoInicial}
        onClose={() => {
          setModalAberto(false);
          setAgendamentoInicial(null);
        }}
        onSaved={salvarAgendamento}
      />
    </div>
  );
}

export default Agenda;
