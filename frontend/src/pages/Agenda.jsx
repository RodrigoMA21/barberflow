import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import AgendamentoModal from "../components/AgendamentoModal";

const SLOT_HEIGHT = 44;
const START_HOUR = 6;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function getDayName(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

function formatDateBR(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function timeStringToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function timeToTop(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).slice(0, 5).split(":").map(Number);
  return ((h * 60 + m - START_HOUR * 60) / 30) * SLOT_HEIGHT;
}

function durToHeight(minutes) {
  return Math.max((minutes / 30) * SLOT_HEIGHT, SLOT_HEIGHT);
}

function getBusinessSlots(dateValue, barbeiro) {
  const slots = [];
  const dias = Array.isArray(barbeiro?.dias_atendimento) ? barbeiro.dias_atendimento.map(Number) : [];
  const inicio = timeStringToMinutes(barbeiro?.horario_inicio);
  const fim = timeStringToMinutes(barbeiro?.horario_fim);
  const intervaloInicio = timeStringToMinutes(barbeiro?.horario_intervalo_inicio);
  const intervaloFim = timeStringToMinutes(barbeiro?.horario_intervalo_fim);
  const diaSelecionado = new Date(`${dateValue}T12:00:00`).getDay();
  if (dias.length > 0 && !dias.includes(diaSelecionado)) return [];
  if (inicio === null || fim === null) {
    for (let m = START_HOUR * 60; m < END_HOUR * 60; m += 30) slots.push(m);
    return slots;
  }
  const ranges = [];
  if (intervaloInicio !== null && intervaloFim !== null && intervaloFim > intervaloInicio) {
    ranges.push([inicio, intervaloInicio], [intervaloFim, fim]);
  } else {
    ranges.push([inicio, fim]);
  }
  for (const [start, end] of ranges) {
    for (let m = start; m < end; m += 30) slots.push(m);
  }
  return slots;
}

function minutesToLabel(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDaysSummary(diasAtendimento, t) {
  const daysMap = {
    0: t("common.day_sun"), 1: t("common.day_mon"), 2: t("common.day_tue"),
    3: t("common.day_wed"), 4: t("common.day_thu"), 5: t("common.day_fri"), 6: t("common.day_sat"),
  };
  const ordered = Array.isArray(diasAtendimento) ? diasAtendimento.map(Number).filter((d) => Number.isInteger(d)).sort((a, b) => a - b) : [];
  if (ordered.length === 0) return t("agenda.allDays");
  if (ordered.length === 6 && !ordered.includes(0)) return t("agenda.monSat");
  if (ordered.length === 5 && ordered.every((d, i) => d === i + 1)) return t("agenda.monFri");
  if (ordered.length === 1) return daysMap[ordered[0]] || t("agenda.dayView");
  return ordered.map((d) => daysMap[d] || String(d)).join(", ");
}

function statusColor(status) {
  const map = {
    agendado: "bg-amber-400",
    confirmado: "bg-primary",
    concluido: "bg-success",
    cancelado: "bg-surface-tertiary",
    nao_compareceu: "bg-text-tertiary",
  };
  return map[status] || "bg-surface-tertiary";
}

function AppointmentBlock({ item, onEdit, onStatusChange, onDelete, t }) {
  const startTop = timeToTop(item.horario);
  const height = durToHeight(Number(item.duracao_total_minutos) || 30);
  return (
    <div
      onClick={() => onEdit(item)}
      className="absolute left-1 right-1 z-20 rounded-lg overflow-hidden cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all shadow-md border border-white/20 group"
      style={{ top: startTop, height: Math.max(height, 28) }}
    >
      <div className={`h-full ${statusColor(item.status)} text-white p-1.5 flex flex-col justify-between text-[11px]`}>
        <div>
          <div className="font-semibold leading-tight truncate">{item.cliente}</div>
          <div className="opacity-80 leading-tight truncate">{item.servicos?.map((s) => s.nome).join(", ") || t("agenda.service")}</div>
        </div>
        <div className="opacity-70 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(item.horario)}-{formatTime(item.termino_em)}
        </div>
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
          {item.status === "agendado" && (
            <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "confirmado"); }} className="bg-white/20 hover:bg-white/40 text-white text-[9px] px-1.5 py-0.5 rounded" title={t("agenda.confirmAction")}>{t("agenda.confirmAction")[0]}</button>
          )}
          {item.status === "confirmado" && (
            <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "concluido"); }} className="bg-white/20 hover:bg-white/40 text-white text-[9px] px-1.5 py-0.5 rounded" title={t("agenda.completeAction")}>✓</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="bg-error/60 hover:bg-error text-white text-[9px] px-1.5 py-0.5 rounded" title={t("agenda.deleteAction")}>×</button>
        </div>
      </div>
    </div>
  );
}

function BarberColumn({ barbeiro, items, onEdit, onStatusChange, onDelete, onFreeSlot, data: colData, isLast, t }) {
  const slots = getBusinessSlots(colData, barbeiro);
  const freeSlots = useMemo(() => {
    const occupied = new Set();
    for (const item of items) {
      if (item.status === "cancelado") continue;
      const inicio = item.inicio_em ? new Date(item.inicio_em) : null;
      const termino = item.termino_em ? new Date(item.termino_em) : null;
      if (!inicio || !termino) continue;
      for (const m of slots) {
        const slotStart = new Date(`${colData}T${minutesToLabel(m)}:00`);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
        if (inicio < slotEnd && termino > slotStart) occupied.add(m);
      }
    }
    return slots.filter((m) => !occupied.has(m));
  }, [items, slots, colData]);
  const columnHeight = TOTAL_HOURS * 60 / 30 * SLOT_HEIGHT;
  return (
    <div className={`min-w-[180px] flex-1 border-r border-border ${isLast ? "border-r-0" : ""}`}>
      <div className="text-center py-3 px-2 border-b border-border bg-surface sticky top-0 z-10">
        <div className="font-semibold text-sm text-text truncate">{barbeiro.nome}</div>
        <div className="text-[11px] text-text-tertiary truncate">{formatDaysSummary(barbeiro.dias_atendimento, t)}</div>
        <div className="text-[10px] text-text-tertiary truncate">
          {barbeiro.horario_inicio ? `${formatTime(barbeiro.horario_inicio)}—${formatTime(barbeiro.horario_fim)}` : t("agenda.free")}
        </div>
      </div>
      <div className="relative" style={{ height: columnHeight }}>
        {items.filter((i) => i.status !== "cancelado").map((item) => (
          <AppointmentBlock key={item.id} item={item} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} t={t} />
        ))}
        {freeSlots.map((m) => (
          <div key={m} onClick={() => onFreeSlot(barbeiro, m)} className="absolute left-0 right-0 z-10 cursor-pointer hover:bg-primary-light/50 transition-colors border-b border-dashed border-border flex items-center justify-center group" style={{ top: ((m - START_HOUR * 60) / 30) * SLOT_HEIGHT, height: SLOT_HEIGHT }}>
            <span className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary text-text-tertiary group-hover:text-primary flex items-center justify-center text-xs font-bold transition-colors">+</span>
          </div>
        ))}
        {slots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-tertiary">{t("agenda.notWorking")}</div>
        )}
      </div>
    </div>
  );
}

function NoBarberColumn({ items, onEdit, onStatusChange, onDelete, t }) {
  const columnHeight = TOTAL_HOURS * 60 / 30 * SLOT_HEIGHT;
  const filtered = useMemo(() => items.filter((i) => i.status !== "cancelado"), [items]);
  return (
    <div className="min-w-[180px] flex-1">
      <div className="text-center py-3 px-2 border-b border-border bg-surface sticky top-0 z-10">
        <div className="font-semibold text-sm text-text">{t("agenda.noService")}</div>
        <div className="text-xs text-text-tertiary">{t("agenda.noAssignment")}</div>
      </div>
      <div className="relative" style={{ height: columnHeight }}>
        {filtered.map((item) => (
          <AppointmentBlock key={item.id} item={item} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} t={t} />
        ))}
      </div>
    </div>
  );
}

function Agenda() {
  const hoje = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(hoje);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [barbeiros, setBarbeiros] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoInicial, setAgendamentoInicial] = useState(null);
  const [mobileTab, setMobileTab] = useState(0);
  const { t } = useTranslation();
  const notify = useNotify();

  useEffect(() => {
    void (async () => {
      const response = await api("/barbeiros");
      const d = await response.json();
      setBarbeiros(d.filter((b) => b.ativo));
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams({ data });
      if (barbeiroId) params.append("barbeiro_id", barbeiroId);
      const response = await api(`/agendamentos/agenda?${params.toString()}`);
      const d = await response.json();
      setAgenda(Array.isArray(d) ? d : []);
    })();
  }, [data, barbeiroId]);

  async function recarregarAgenda() {
    const params = new URLSearchParams({ data });
    if (barbeiroId) params.append("barbeiro_id", barbeiroId);
    const response = await api(`/agendamentos/agenda?${params.toString()}`);
    const d = await response.json();
    setAgenda(Array.isArray(d) ? d : []);
  }

  const agendaPorBarbeiro = useMemo(() => {
    const grouped = new Map();
    for (const b of barbeiros) grouped.set(String(b.id), []);
    for (const item of agenda) {
      const key = String(item.barbeiro_id || "");
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return grouped;
  }, [agenda, barbeiros]);

  async function atualizarStatusAgendamento(id, novoStatus) {
    const response = await api(`/agendamentos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: novoStatus }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || t("agenda.errorUpdateStatus"));
      return;
    }
    recarregarAgenda();
  }

  async function deletarAgendamento(id) {
    if (!window.confirm(t("agenda.confirmDelete"))) return;
    await api(`/agendamentos/${id}`, { method: "DELETE" });
    recarregarAgenda();
  }

  function agendarHorarioLivre(barbeiro, slotMinutes) {
    const horas = String(Math.floor(slotMinutes / 60)).padStart(2, "0");
    const mins = String(slotMinutes % 60).padStart(2, "0");
    setAgendamentoInicial({ data, horario: `${horas}:${mins}`, barbeiro_id: String(barbeiro.id), status: "agendado", cliente_id: "", servicos: [] });
    setModalAberto(true);
  }

  function editarAgendamento(item) {
    setAgendamentoInicial(item);
    setModalAberto(true);
  }

  const barbersToShow = useMemo(
    () => barbeiroId ? barbeiros.filter((b) => String(b.id) === barbeiroId) : barbeiros,
    [barbeiroId, barbeiros],
  );

  const hours = useMemo(() => {
    const arr = [];
    for (let h = START_HOUR; h < END_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const allColumns = useMemo(() => {
    const cols = [];
    for (const barbeiro of barbersToShow) {
      const items = agendaPorBarbeiro.get(String(barbeiro.id)) || [];
      cols.push({ type: "barber", barbeiro, items });
    }
    if (!barbeiroId) {
      const semBarbeiro = agendaPorBarbeiro.get("") || [];
      if (semBarbeiro.length > 0) cols.push({ type: "nobarber", items: semBarbeiro });
    }
    return cols;
  }, [barbersToShow, agendaPorBarbeiro, barbeiroId]);

  const currentCol = allColumns.length > 0 ? (allColumns[mobileTab] || allColumns[0]) : null;

  function navegarDia(delta) {
    const d = new Date(`${data}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setData(d.toISOString().split("T")[0]);
  }

  const header = (
    <div className="card-static p-4 mb-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navegarDia(-1)} className="btn-ghost btn-icon text-base leading-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-sm font-semibold text-text whitespace-nowrap">{formatDateBR(data)}</span>
          <button onClick={() => navegarDia(1)} className="btn-ghost btn-icon text-base leading-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="text-xs text-text-tertiary capitalize">{getDayName(data)}</div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-text-tertiary hidden sm:inline">{t("agenda.barber")}</label>
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} className="select py-1.5 text-sm">
            <option value="">{t("agenda.all")}</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setData(hoje)} className="btn-ghost text-xs px-3 py-1.5 rounded-lg">{t("agenda.today")}</button>
      </div>
    </div>
  );

  const modal = (
    <AgendamentoModal
      key={`${modalAberto}-${agendamentoInicial?.id || "new"}`}
      open={modalAberto}
      initialData={agendamentoInicial}
      onClose={() => { setModalAberto(false); setAgendamentoInicial(null); }}
      onSaved={recarregarAgenda}
    />
  );

  const timeColumn = (
    <div className="w-14 shrink-0 border-r border-border bg-surface-secondary">
      <div className="h-[53px]" />
      {hours.map((h) => (
        <div key={h} className="relative" style={{ height: SLOT_HEIGHT * 2 }}>
          <span className="absolute -top-2.5 left-2 text-[10px] text-text-tertiary font-mono">{String(h).padStart(2, "0")}:00</span>
        </div>
      ))}
    </div>
  );

  const timeColumnMobile = (
    <div className="w-12 shrink-0 border-r border-border bg-surface-secondary">
      <div className="h-[53px]" />
      {hours.map((h) => (
        <div key={h} className="relative" style={{ height: SLOT_HEIGHT * 2 }}>
          <span className="absolute -top-2.5 left-1 text-[10px] text-text-tertiary font-mono">{String(h).padStart(2, "0")}:00</span>
        </div>
      ))}
    </div>
  );

  if (barbeiros.length === 0 && !barbeiroId) {
    return (
      <div className="animate-fade-in">
        {header}
        <div className="card-static p-6 text-sm text-text-tertiary text-center">{t("agenda.noBarbers")}</div>
        {modal}
      </div>
    );
  }

  if (allColumns.length === 0) {
    return (
      <div className="animate-fade-in">
        {header}
        <div className="card-static p-6 text-sm text-text-tertiary text-center">{t("agenda.noAppointments")}</div>
        {modal}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {header}
      <div className="hidden md:block card-static overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex" style={{ minWidth: Math.max(allColumns.length * 200, 300) }}>
            {timeColumn}
            {allColumns.map((col, i) =>
              col.type === "barber" ? (
                <BarberColumn key={col.barbeiro.id} barbeiro={col.barbeiro} items={col.items} isLast={i === allColumns.length - 1} onEdit={editarAgendamento} onStatusChange={atualizarStatusAgendamento} onDelete={deletarAgendamento} onFreeSlot={agendarHorarioLivre} data={data} t={t} />
              ) : (
                <NoBarberColumn key="nobarber" items={col.items} onEdit={editarAgendamento} onStatusChange={atualizarStatusAgendamento} onDelete={deletarAgendamento} t={t} />
              )
            )}
          </div>
        </div>
      </div>
      <div className="md:hidden">
        {allColumns.length > 1 && (
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {allColumns.map((col, i) => (
              <button
                key={i}
                onClick={() => setMobileTab(Math.min(i, allColumns.length - 1))}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${mobileTab === i ? "bg-primary text-surface border-primary" : "bg-surface text-text-secondary border-border"}`}
              >
                {col.type === "barber" ? col.barbeiro.nome : t("agenda.noService")}
              </button>
            ))}
          </div>
        )}
        {currentCol && (
          <div className="card-static overflow-hidden">
            <div className="flex">
              {timeColumnMobile}
              {currentCol.type === "barber" ? (
                <BarberColumn barbeiro={currentCol.barbeiro} items={currentCol.items} isLast onEdit={editarAgendamento} onStatusChange={atualizarStatusAgendamento} onDelete={deletarAgendamento} onFreeSlot={agendarHorarioLivre} data={data} t={t} />
              ) : (
                <NoBarberColumn items={currentCol.items} onEdit={editarAgendamento} onStatusChange={atualizarStatusAgendamento} onDelete={deletarAgendamento} t={t} />
              )}
            </div>
          </div>
        )}
      </div>
      {modal}
    </div>
  );
}

export default Agenda;
