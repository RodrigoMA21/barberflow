import { useEffect, useMemo, useState } from "react";

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function getDayName(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

function getBusinessSlots(dateValue) {
  const day = new Date(`${dateValue}T12:00:00`).getDay();

  if (day === 0) return [];

  const slots = [];
  const windows =
    day === 6
      ? [[8 * 60, 12 * 60]]
      : [
          [8 * 60, 12 * 60],
          [13 * 60 + 30, 19 * 60],
        ];

  for (const [start, end] of windows) {
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

function Agenda() {
  const hoje = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(hoje);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [barbeiros, setBarbeiros] = useState([]);
  const [agenda, setAgenda] = useState([]);

  async function carregarBarbeiros() {
    const response = await fetch("http://localhost:3000/barbeiros");
    const responseData = await response.json();
    setBarbeiros(responseData.filter((barbeiro) => barbeiro.ativo));
  }

  async function carregarAgenda() {
    const params = new URLSearchParams({ data });

    if (barbeiroId) params.append("barbeiro_id", barbeiroId);

    const response = await fetch(
      `http://localhost:3000/agendamentos/agenda?${params.toString()}`,
    );
    const responseData = await response.json();
    setAgenda(Array.isArray(responseData) ? responseData : []);
  }

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  useEffect(() => {
    carregarAgenda();
  }, [data, barbeiroId]);

  const slots = useMemo(() => getBusinessSlots(data), [data]);

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

      {barbersToShow.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">
          Nenhum barbeiro ativo cadastrado. Cadastre barbeiros para visualizar a agenda.
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">Barbearia fechada neste dia.</div>
      ) : (
        <div className="space-y-4">
          {barbersToShow.map((barbeiro) => {
            const items = agendaPorBarbeiro.get(String(barbeiro.id)) || [];

            return (
              <div key={barbeiro.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-semibold">{barbeiro.nome}</h2>
                    <p className="text-sm text-gray-500">{barbeiro.especialidade || "Sem especialidade"}</p>
                  </div>

                  <span className="text-sm text-gray-500">{items.length} agendamentos</span>
                </div>

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
                        </div>

                        <div className="text-right text-sm">
                          {ocupado ? (
                            <>
                              <div>{itemPrincipal.servicos?.map((s) => s.nome).join(", ") || "Serviço"}</div>
                              <div>
                                {formatTime(itemPrincipal.horario)} - {formatTime(itemPrincipal.termino_em)}
                              </div>
                            </>
                          ) : (
                            <div>Disponível</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Agenda;
