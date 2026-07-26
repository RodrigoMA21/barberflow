import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const notify = useNotify();

  const editingId = initialData?.id || null;
  const [clienteId, setClienteId] = useState(() => (initialData?.cliente_id ? String(initialData.cliente_id) : ""));
  const [barbeiroId, setBarbeiroId] = useState(() => (initialData?.barbeiro_id ? String(initialData.barbeiro_id) : ""));
  const [servicoIds, setServicoIds] = useState(() =>
    initialData?.servicos ? initialData.servicos.map((s) => String(s.id)) : [],
  );
  const [status, setStatus] = useState(() => initialData?.status || "agendado");
  const [descontoValor, setDescontoValor] = useState(() => initialData?.desconto_valor ?? "");
  const [valorFinal] = useState(() => initialData?.valor_final ?? "");
  const [data, setData] = useState(() => (initialData?.data ? String(initialData.data).split("T")[0] : ""));
  const [horario, setHorario] = useState(() => (initialData?.horario ? String(initialData.horario).slice(0, 5) : ""));

  useEffect(() => {
    if (!open) return;
    async function carregarDados() {
      const [clientesRes, servicosRes, barbeirosRes] = await Promise.all([api("/clientes"), api("/servicos"), api("/barbeiros")]);
      setClientes(await clientesRes.json());
      setServicos(await servicosRes.json());
      setBarbeiros((await barbeirosRes.json()).filter((b) => b.ativo));
    }
    carregarDados();
  }, [open]);

  const servicosSelecionados = useMemo(() => servicos.filter((s) => servicoIds.includes(String(s.id))), [servicos, servicoIds]);
  const valorBruto = useMemo(() => servicosSelecionados.reduce((t, s) => t + Number(s.preco || 0), 0), [servicosSelecionados]);
  const duracaoTotalMinutos = useMemo(() => servicosSelecionados.reduce((t, s) => t + Number(s.duracao_minutos || 30), 0), [servicosSelecionados]);
  const valorFinalCalculado = useMemo(() => {
    if (valorFinal !== "") return Math.max(Number(valorFinal) || 0, 0);
    return Math.max(valorBruto - (Number(descontoValor) || 0), 0);
  }, [descontoValor, valorBruto, valorFinal]);

  function validar() {
    const errs = {};
    if (!clienteId) errs.cliente = "Selecione um cliente";
    if (!data) errs.data = "Informe a data";
    if (!horario) errs.horario = "Informe o horário";
    if (servicoIds.length === 0) errs.servicos = "Selecione ao menos um serviço";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    const payload = {
      cliente_id: clienteId, barbeiro_id: barbeiroId || null, servico_ids: servicoIds, data, horario, status,
      desconto_valor: descontoValor === "" ? 0 : Number(descontoValor),
      valor_final: valorFinal === "" ? null : Number(valorFinal),
    };
    const response = editingId
      ? await api(`/agendamentos/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await api("/agendamentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao salvar agendamento");
      return;
    }
    notify(editingId ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!", "success");
    if (onSaved) await onSaved();
    onClose();
  }

  function limparErro(campo) {
    setErrors((prev) => ({ ...prev, [campo]: undefined }));
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 pt-[10vh] animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={editingId ? t("agendamentos.edit") : t("agendamentos.new")}
    >
      <div
        className="w-full max-w-2xl bg-surface rounded-2xl shadow-modal animate-scale-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
          <div>
            <h2 className="text-lg font-semibold text-text">{editingId ? t("agendamentos.edit") : t("agendamentos.new")}</h2>
            <p className="text-sm text-text-tertiary">{t("agendamentos.description")}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost btn-icon shrink-0" aria-label={t("common.close")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={salvar} className="p-6 space-y-5 bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-cliente" className="input-label">{t("agendamentos.client")} <span className="text-error">*</span></label>
              <select
                id="modal-cliente"
                value={clienteId}
                onChange={(e) => { setClienteId(e.target.value); limparErro("cliente"); }}
                className={`select bg-surface-secondary ${errors.cliente ? "input-error" : ""}`}
              >
                <option value="">{t("agendamentos.selectClient")}</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {errors.cliente && <p className="text-xs mt-1 text-error">{errors.cliente}</p>}
            </div>
            <div>
              <label htmlFor="modal-barbeiro" className="input-label">{t("agendamentos.barber")}</label>
              <select
                id="modal-barbeiro"
                value={barbeiroId}
                onChange={(e) => setBarbeiroId(e.target.value)}
                className="select bg-surface-secondary"
              >
                <option value="">{t("agendamentos.selectBarber")}</option>
                {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="modal-data" className="input-label">{t("agendamentos.date")} <span className="text-error">*</span></label>
              <input
                id="modal-data"
                type="date"
                value={data}
                onChange={(e) => { setData(e.target.value); limparErro("data"); }}
                className={`input bg-surface-secondary ${errors.data ? "input-error" : ""}`}
              />
              {errors.data && <p className="text-xs mt-1 text-error">{errors.data}</p>}
            </div>
            <div>
              <label htmlFor="modal-horario" className="input-label">{t("agendamentos.time")} <span className="text-error">*</span></label>
              <input
                id="modal-horario"
                type="time"
                value={horario}
                onChange={(e) => { setHorario(e.target.value); limparErro("horario"); }}
                className={`input bg-surface-secondary ${errors.horario ? "input-error" : ""}`}
              />
              {errors.horario && <p className="text-xs mt-1 text-error">{errors.horario}</p>}
            </div>
            <div>
              <label htmlFor="modal-status" className="input-label">{t("agendamentos.status")}</label>
              <select
                id="modal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select bg-surface-secondary"
              >
                <option value="agendado">{t("agendamentos.scheduled")}</option>
                <option value="confirmado">{t("agendamentos.confirmed")}</option>
                <option value="concluido">{t("agendamentos.completed")}</option>
                <option value="cancelado">{t("agendamentos.cancelled")}</option>
                <option value="nao_compareceu">{t("agendamentos.noShow")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="modal-desconto" className="input-label">{t("agendamentos.discount")}</label>
              <input
                id="modal-desconto"
                type="number" min="0" step="0.01"
                value={descontoValor}
                onChange={(e) => setDescontoValor(e.target.value)}
                className="input bg-surface-secondary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text">{t("agendamentos.services")} <span className="text-error">*</span></label>
              {servicoIds.length > 0 && <span className="text-xs text-text-tertiary">{servicoIds.length} {t("agendamentos.selected", { count: servicoIds.length })}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {servicos.map((servico) => {
                const selected = servicoIds.includes(String(servico.id));
                return (
                  <button
                    type="button"
                    key={servico.id}
                    onClick={() => { setServicoIds((prev) => selected ? prev.filter((s) => s !== String(servico.id)) : [...prev, String(servico.id)]); limparErro("servicos"); }}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${selected ? "border-primary bg-primary-light" : "border-border bg-surface-secondary"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-text"}`}>{servico.nome}</span>
                      {selected && <span className="text-sm font-bold shrink-0 text-primary">✓</span>}
                    </div>
                    <div className="mt-1 text-xs space-y-0.5 text-text-tertiary">
                      <div>R$ {Number(servico.preco).toFixed(2)}</div>
                      <div>{servico.duracao_minutos || 30} min</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.servicos && <p className="text-xs text-error">{errors.servicos}</p>}
          </div>

          <div className="rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border border-border bg-surface-secondary">
            <div>
              <span className="block text-xs text-text-tertiary">{t("agendamentos.startTime")}</span>
              <strong className="text-text">{data && horario ? `${formatDateBR(data)} ${formatTime(horario)}` : "—"}</strong>
            </div>
            <div>
              <span className="block text-xs text-text-tertiary">{t("agendamentos.estimatedEnd")}</span>
              <strong className="text-text">
                {data && horario ? `${formatDateBR(data)} ${addMinutesToTime(horario, duracaoTotalMinutos)}` : "—"}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-text-tertiary">{t("agendamentos.amount")}</span>
              <strong className="text-text">R$ {valorFinalCalculado.toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-surface/30 border-t-surface animate-spin" />
                  Salvando...
                </span>
              ) : editingId ? "Salvar" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
