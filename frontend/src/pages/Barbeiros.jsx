import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useNotify } from "../components/Notification";

const DIAS = [
  { value: 1, label: "common.monday" },
  { value: 2, label: "common.tuesday" },
  { value: 3, label: "common.wednesday" },
  { value: 4, label: "common.thursday" },
  { value: 5, label: "common.friday" },
  { value: 6, label: "common.saturday" },
  { value: 0, label: "common.sunday" },
];

function Barbeiros() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [foto, setFoto] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [diasAtendimento, setDiasAtendimento] = useState([]);
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [horarioIntervaloInicio, setHorarioIntervaloInicio] = useState("");
  const [horarioIntervaloFim, setHorarioIntervaloFim] = useState("");
  const [barbeiroEditando, setBarbeiroEditando] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [barbeiroParaDeletar, setBarbeiroParaDeletar] = useState(null);
  const [barbeiroStats, setBarbeiroStats] = useState(null);
  const [statsAberto, setStatsAberto] = useState(null);
  const { t } = useTranslation();
  const notify = useNotify();

  async function recarregarBarbeiros() {
    const response = await api("/barbeiros");
    const data = await response.json();
    setBarbeiros(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void (async () => {
      const response = await api("/barbeiros");
      const data = await response.json();
      setBarbeiros(Array.isArray(data) ? data : []);
    })();
  }, []);

  async function cadastrarBarbeiro(e) {
    e.preventDefault();
    const barbeiroData = {
      nome, telefone, especialidade, foto, ativo,
      dias_atendimento: diasAtendimento,
      horario_inicio: horarioInicio || null,
      horario_fim: horarioFim || null,
      horario_intervalo_inicio: horarioIntervaloInicio || null,
      horario_intervalo_fim: horarioIntervaloFim || null,
    };
    if (barbeiroEditando) {
      await api(`/barbeiros/${barbeiroEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(barbeiroData),
      });
      setBarbeiroEditando(null);
    } else {
      await api("/barbeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(barbeiroData),
      });
    }
    setNome(""); setTelefone(""); setEspecialidade(""); setFoto("");
    setAtivo(true); setDiasAtendimento([]);
    setHorarioInicio(""); setHorarioFim("");
    setHorarioIntervaloInicio(""); setHorarioIntervaloFim("");
    recarregarBarbeiros();
  }

  async function deletarBarbeiro(id) {
    await api(`/barbeiros/${id}`, { method: "DELETE" });
    recarregarBarbeiros();
  }

  function pedirConfirmacaoDeletar(barbeiro) {
    setBarbeiroParaDeletar(barbeiro);
    setShowConfirm(true);
  }

  async function confirmarDeletar() {
    if (!barbeiroParaDeletar) return;
    await deletarBarbeiro(barbeiroParaDeletar.id);
    setShowConfirm(false);
    setBarbeiroParaDeletar(null);
  }

  function cancelarDeletar() {
    setShowConfirm(false);
    setBarbeiroParaDeletar(null);
  }

  async function toggleStats(barbeiro) {
    if (statsAberto === barbeiro.id) {
      setStatsAberto(null);
      setBarbeiroStats(null);
      return;
    }
    setStatsAberto(barbeiro.id);
    setBarbeiroStats(null);
    try {
      const response = await api(`/barbeiros/${barbeiro.id}/stats`);
      const data = await response.json();
      setBarbeiroStats(data);
    } catch {
      notify(t("barbeiroStats.error"));
      setBarbeiroStats(null);
    }
  }

  function editarBarbeiro(barbeiro) {
    setBarbeiroEditando(barbeiro);
    setNome(barbeiro.nome);
    setTelefone(barbeiro.telefone || "");
    setEspecialidade(barbeiro.especialidade || "");
    setFoto(barbeiro.foto || "");
    setAtivo(Boolean(barbeiro.ativo));
    setDiasAtendimento(Array.isArray(barbeiro.dias_atendimento) ? barbeiro.dias_atendimento.map(String) : []);
    setHorarioInicio(barbeiro.horario_inicio || "");
    setHorarioFim(barbeiro.horario_fim || "");
    setHorarioIntervaloInicio(barbeiro.horario_intervalo_inicio || "");
    setHorarioIntervaloFim(barbeiro.horario_intervalo_fim || "");
  }

  function limparFormulario() {
    setBarbeiroEditando(null);
    setNome(""); setTelefone(""); setEspecialidade(""); setFoto("");
    setAtivo(true); setDiasAtendimento([]);
    setHorarioInicio(""); setHorarioFim("");
    setHorarioIntervaloInicio(""); setHorarioIntervaloFim("");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={cadastrarBarbeiro} className="card-static p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="input-label">{t("common.name")}</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("common.phone")}</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("common.specialty")}</label>
            <input type="text" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">{t("common.photo")}</label>
            <input type="url" value={foto} onChange={(e) => setFoto(e.target.value)} className="input" />
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 accent-primary" />
          <label className="text-sm text-text">{t("barbeiros.active")}</label>
        </div>

        <div className="mb-4 card-static p-4">
          <h3 className="font-semibold mb-3 text-text">{t("barbeiros.schedule")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {DIAS.map((dia) => {
              const selected = diasAtendimento.includes(String(dia.value));
              return (
                <button
                  type="button"
                  key={dia.value}
                  onClick={() => {
                    setDiasAtendimento((prev) =>
                      selected ? prev.filter((item) => item !== String(dia.value)) : [...prev, String(dia.value)],
                    );
                  }}
                  className={`text-left rounded-lg border-2 p-3 transition-all cursor-pointer ${
                    selected ? "border-primary bg-primary-light" : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-text">{t(dia.label)}</span>
                    {selected && <span className="text-primary text-lg leading-none shrink-0">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-text-tertiary mb-4">{t("barbeiros.noDays")}</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="input-label">{t("barbeiros.start")}</label>
              <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">{t("barbeiros.end")}</label>
              <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">{t("barbeiros.breakStart")}</label>
              <input type="time" value={horarioIntervaloInicio} onChange={(e) => setHorarioIntervaloInicio(e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">{t("barbeiros.breakEnd")}</label>
              <input type="time" value={horarioIntervaloFim} onChange={(e) => setHorarioIntervaloFim(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary">
            {barbeiroEditando ? t("common.update") : t("common.create")}
          </button>
          {barbeiroEditando && (
            <button type="button" onClick={limparFormulario} className="btn-ghost px-4 py-2 rounded-lg text-sm">
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {barbeiros.map((barbeiro) => (
          <div key={barbeiro.id} className="card-static p-4 flex gap-4 items-start animate-fade-in-up">
            {barbeiro.foto ? (
              <img src={barbeiro.foto} alt={barbeiro.nome} className="w-16 h-16 rounded-xl object-cover bg-surface-tertiary" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-tertiary flex items-center justify-center text-text-tertiary text-xs">
                {t("common.noPhoto")}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                    {barbeiro.nome}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${barbeiro.ativo ? "badge-success" : "badge-neutral"}`}>
                      {barbeiro.ativo ? t("barbeiros.active") : t("barbeiros.inactive")}
                    </span>
                  </h2>
                  <p className="text-text-secondary">{barbeiro.telefone || t("common.noPhone")}</p>
                  <p className="text-text-secondary">{barbeiro.especialidade || t("common.noSpecialty")}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => toggleStats(barbeiro)} className="btn-ghost px-3 py-2 rounded-lg text-sm">
                    {statsAberto === barbeiro.id ? t("barbeiroStats.close") : t("barbeiroStats.view")}
                  </button>
                  <button onClick={() => editarBarbeiro(barbeiro)} className="btn-ghost px-3 py-2 rounded-lg text-sm">
                    {t("common.edit")}
                  </button>
                  <button onClick={() => pedirConfirmacaoDeletar(barbeiro)} className="bg-error text-white px-3 py-2 rounded-lg text-sm">
                    {t("common.delete")}
                  </button>
                </div>
              </div>

              {statsAberto === barbeiro.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  {!barbeiroStats ? (
                    <p className="text-sm text-text-tertiary">{t("barbeiroStats.loading")}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-text">{t("barbeiroStats.topClients")}</h4>
                        {barbeiroStats.clientes.length === 0 ? (
                          <p className="text-xs text-text-tertiary">{t("barbeiroStats.noCompleted")}</p>
                        ) : (
                          <ul className="space-y-1">
                            {barbeiroStats.clientes.map((c, i) => (
                              <li key={i} className="text-sm flex justify-between text-text-secondary">
                                <span>{c.nome}</span>
                                <span className="text-text-tertiary">{c.total}x</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-text">{t("barbeiroStats.topDays")}</h4>
                        {barbeiroStats.dias.length === 0 ? (
                          <p className="text-xs text-text-tertiary">{t("barbeiroStats.noData")}</p>
                        ) : (
                          <ul className="space-y-1">
                            {barbeiroStats.dias.map((d, i) => (
                              <li key={i} className="text-sm flex justify-between text-text-secondary">
                                <span>{d.dia}</span>
                                <span className="text-text-tertiary">{d.total}x</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-text">{t("barbeiroStats.totals")}</h4>
                        <ul className="space-y-1">
                          <li className="text-sm flex justify-between text-text-secondary">
                            <span>{t("barbeiroStats.completedAppointments")}</span>
                            <span className="font-semibold text-text">{barbeiroStats.totais.concluidos}</span>
                          </li>
                          <li className="text-sm flex justify-between text-text-secondary">
                            <span>{t("barbeiroStats.totalAppointments")}</span>
                            <span className="font-semibold text-text">{barbeiroStats.totais.total}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card-static p-6 max-w-sm w-full animate-scale-in">
            <h3 className="text-lg font-semibold mb-4 text-text">{t("common.confirm")}</h3>
            <p className="mb-4 text-text-secondary">{t("common.confirmDeleteMessage")}</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelarDeletar} className="btn-ghost px-4 py-2 rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={confirmarDeletar} className="bg-error text-white px-4 py-2 rounded-lg text-sm">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Barbeiros;
