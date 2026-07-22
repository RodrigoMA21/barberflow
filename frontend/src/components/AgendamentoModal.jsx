import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";

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

export default function AgendamentoModal({ open, initialData, onClose, onSaved }) {
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const notify = useNotify();

  const editingId = initialData?.id || null;
  const [clienteId, setClienteId] = useState(() => (initialData?.cliente_id ? String(initialData.cliente_id) : ""));
  const [barbeiroId, setBarbeiroId] = useState(() => (initialData?.barbeiro_id ? String(initialData.barbeiro_id) : ""));
  const [servicoIds, setServicoIds] = useState(() =>
    initialData?.servicos ? initialData.servicos.map((servico) => String(servico.id)) : [],
  );
  const [status, setStatus] = useState(() => initialData?.status || "agendado");
  const [descontoValor, setDescontoValor] = useState(() => initialData?.desconto_valor ?? "");
  const [valorFinal, setValorFinal] = useState(() => initialData?.valor_final ?? "");
  const [data, setData] = useState(() => (initialData?.data ? String(initialData.data).split("T")[0] : ""));
  const [horario, setHorario] = useState(() => (initialData?.horario ? String(initialData.horario).slice(0, 5) : ""));

  useEffect(() => {
    if (!open) return;

    async function carregarDados() {
      const [clientesRes, servicosRes, barbeirosRes] = await Promise.all([
        api("/clientes"),
        api("/servicos"),
        api("/barbeiros"),
      ]);

      const [clientesData, servicosData, barbeirosData] = await Promise.all([
        clientesRes.json(),
        servicosRes.json(),
        barbeirosRes.json(),
      ]);

      setClientes(clientesData);
      setServicos(servicosData);
      setBarbeiros(barbeirosData.filter((barbeiro) => barbeiro.ativo));
    }

    carregarDados();
  }, [open]);

  const servicosSelecionados = useMemo(
    () => servicos.filter((servico) => servicoIds.includes(String(servico.id))),
    [servicos, servicoIds],
  );

  const valorBruto = useMemo(
    () => servicosSelecionados.reduce((total, servico) => total + Number(servico.preco || 0), 0),
    [servicosSelecionados],
  );

  const duracaoTotalMinutos = useMemo(
    () => servicosSelecionados.reduce((total, servico) => total + Number(servico.duracao_minutos || 30), 0),
    [servicosSelecionados],
  );

  const valorFinalCalculado = useMemo(() => {
    if (valorFinal !== "") return Math.max(Number(valorFinal) || 0, 0);
    return Math.max(valorBruto - (Number(descontoValor) || 0), 0);
  }, [descontoValor, valorBruto, valorFinal]);

  async function salvar(e) {
    e.preventDefault();

    const payload = {
      cliente_id: clienteId,
      barbeiro_id: barbeiroId || null,
      servico_ids: servicoIds,
      data,
      horario,
      status,
      desconto_valor: descontoValor === "" ? 0 : Number(descontoValor),
      valor_final: valorFinal === "" ? null : Number(valorFinal),
    };

    const response = editingId
      ? await api(`/agendamentos/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await api("/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao salvar agendamento");
      return;
    }

    if (onSaved) await onSaved();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Editar agendamento" : "Novo agendamento"}</h2>
            <p className="text-sm text-gray-500">Edite sem sair da tela.</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm bg-gray-100">
            Fechar
          </button>
        </div>

        <form onSubmit={salvar} className="p-6 space-y-4">
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
              <input type="number" min="0" step="0.01" value={descontoValor} onChange={(e) => setDescontoValor(e.target.value)} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block mb-1">Valor final (R$)</label>
              <input type="number" min="0" step="0.01" value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>

          <div>
            <label className="block mb-1">Serviços</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className={`text-left rounded-lg border-2 p-3 transition-all cursor-pointer ${
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

                    <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                      <div>R$ {Number(servico.preco).toFixed(2)}</div>
                      <div>{servico.duracao_minutos || 30} min</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-gray-500">Horário de início</span>
              <strong>{data && horario ? `${formatDateBR(data)} ${formatTime(horario)}` : "Selecione a data e hora"}</strong>
            </div>

            <div>
              <span className="block text-gray-500">Horário previsto de término</span>
              <strong>
                {data && horario
                  ? `${formatDateBR(data)} ${addMinutesToTime(horario, duracaoTotalMinutos)}`
                  : "Selecione os serviços"}
              </strong>
            </div>

            <div>
              <span className="block text-gray-500">Valor a faturar</span>
              <strong>R$ {valorFinalCalculado.toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-black px-4 py-2 rounded">
              Cancelar
            </button>

            <button type="submit" className="bg-black text-white px-4 py-2 rounded">
              {editingId ? "Salvar" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}