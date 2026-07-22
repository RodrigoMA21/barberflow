import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import AgendamentoModal from "../components/AgendamentoModal";

function formatDateTime(data, horario) {
  if (!data) return "";

  // `data` can be stored as a plain date (YYYY-MM-DD) or as an ISO string
  // with time (YYYY-MM-DDTHH:mm:ssZ). Extract the date part when present
  // to avoid building invalid ISO strings like `...ZT13:00:00`.
  const datePart = data.includes("T") ? data.split("T")[0] : data;
  const timePart = horario ? horario.slice(0, 5) : "00:00";

  const iso = `${datePart}T${timePart}`;
  const d = new Date(iso);

  if (isNaN(d.getTime())) {
    // fallback: try parsing the original value
    const d2 = new Date(data);
    if (!isNaN(d2.getTime())) {
      return d2.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return "Data inválida";
  }

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function Historico() {
  const [historico, setHistorico] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const notify = useNotify();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [page, setPage] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoInicial, setAgendamentoInicial] = useState(null);

  const limit = 6;

  const carregarHistorico = useCallback(async (pageAtual = page) => {
    const params = new URLSearchParams();
    params.append("page", String(pageAtual));
    params.append("limit", String(limit));
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (clienteId) params.append("cliente_id", clienteId);

    const res = await api(
      `/agendamentos/historico?${params.toString()}`,
    );

    const data = await res.json();
    setHistorico(data.data || []);
    setMeta(data.meta || { page: pageAtual, limit, total: 0 });
  }, [clienteId, limit, month, page, year]);

  useEffect(() => {
    void (async () => {
      const resClientes = await api("/clientes");
      const clientesData = await resClientes.json();
      setClientes(clientesData);

      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", String(limit));

      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (clienteId) params.append("cliente_id", clienteId);

      const resHistorico = await api(
        `/agendamentos/historico?${params.toString()}`,
      );

      const historicoData = await resHistorico.json();
      setHistorico(historicoData.data || []);
      setMeta(historicoData.meta || { page: 1, limit, total: 0 });
    })();
  }, [clienteId, limit, month, year]);

  async function excluirAgendamento(id) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este agendamento?");

    if (!confirmar) return;

    const response = await api(`/agendamentos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao excluir agendamento");
      return;
    }

    carregarHistorico(page);
  }

  function editarAgendamento(id) {
    const agendamento = historico.find((item) => String(item.id) === String(id));
    setAgendamentoInicial(agendamento || { id });
    setModalAberto(true);
  }

  function aplicarFiltros() {
    setPage(1);
    carregarHistorico(1);
  }

  function limparFiltros() {
    setMonth("");
    setYear("");
    setClienteId("");
    setPage(1);
    carregarHistorico(1);
  }

  function irParaPagina(novaPagina) {
    if (novaPagina < 1) return;

    const totalPages = Math.max(1, Math.ceil((meta.total || 0) / meta.limit));

    if (novaPagina > totalPages) return;

    setPage(novaPagina);
    carregarHistorico(novaPagina);
  }

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / meta.limit));

  return (
    <div>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Filtros</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Mês</label>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
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
          </div>

          <div>
            <label className="block mb-1">Ano</label>

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Todos"
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Cliente</label>

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={aplicarFiltros}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Aplicar
          </button>

          <button
            onClick={limparFiltros}
            className="bg-gray-300 text-black px-4 py-2 rounded"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {historico.map((h) => (
          <div key={h.id} className="bg-white p-4 rounded shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{h.cliente}</h2>
                <p className="text-sm text-gray-500">{h.barbeiro || "Sem barbeiro"}</p>
              </div>

              <span className={`text-xs px-2 py-1 rounded-full ${statusClass(h.status)}`}>
                {statusLabel(h.status)}
              </span>
            </div>

            <p>Data e hora: {formatDateTime(h.data, h.horario)}</p>

            <p>
              Serviços:{" "}
              {h.servicos && h.servicos.length > 0
                ? h.servicos.map((s) => s.nome).join(", ")
                : "—"}
            </p>

            <p>Valor bruto: R$ {Number(h.total_bruto || 0).toFixed(2)}</p>
            <p>Desconto: R$ {Number(h.desconto_valor || 0).toFixed(2)}</p>
            <p>Valor final: R$ {Number(h.total || 0).toFixed(2)}</p>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => editarAgendamento(h.id)}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => excluirAgendamento(h.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {historico.length === 0 && (
          <div className="bg-white p-4 rounded shadow">
            Nenhum histórico encontrado.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between bg-white p-4 rounded shadow">
        <button
          onClick={() => irParaPagina(page - 1)}
          disabled={page <= 1}
          className="bg-gray-300 text-black px-4 py-2 rounded disabled:opacity-50"
        >
          Anterior
        </button>

        <span>
          Página {meta.page || page} de {totalPages}
        </span>

        <button
          onClick={() => irParaPagina(page + 1)}
          disabled={page >= totalPages}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      <AgendamentoModal
        key={`${modalAberto ? "open" : "closed"}-${agendamentoInicial?.id || "new"}-${agendamentoInicial?.data || ""}-${agendamentoInicial?.horario || ""}`}
        open={modalAberto}
        initialData={agendamentoInicial}
        onClose={() => {
          setModalAberto(false);
          setAgendamentoInicial(null);
        }}
        onSaved={() => carregarHistorico(page)}
      />
    </div>
  );
}

export default Historico;
