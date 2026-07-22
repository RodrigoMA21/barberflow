import { useEffect, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";

const DIAS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
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
      nome,
      telefone,
      especialidade,
      foto,
      ativo,
      dias_atendimento: diasAtendimento,
      horario_inicio: horarioInicio || null,
      horario_fim: horarioFim || null,
      horario_intervalo_inicio: horarioIntervaloInicio || null,
      horario_intervalo_fim: horarioIntervaloFim || null,
    };

    if (barbeiroEditando) {
      await api(`/barbeiros/${barbeiroEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(barbeiroData),
      });

      setBarbeiroEditando(null);
    } else {
      await api("/barbeiros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(barbeiroData),
      });
    }

    setNome("");
    setTelefone("");
    setEspecialidade("");
    setFoto("");
    setAtivo(true);
    setDiasAtendimento([]);
    setHorarioInicio("");
    setHorarioFim("");
    setHorarioIntervaloInicio("");
    setHorarioIntervaloFim("");

    recarregarBarbeiros();
  }

  async function deletarBarbeiro(id) {
    await api(`/barbeiros/${id}`, {
      method: "DELETE",
    });

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
    setNome("");
    setTelefone("");
    setEspecialidade("");
    setFoto("");
    setAtivo(true);
    setDiasAtendimento([]);
    setHorarioInicio("");
    setHorarioFim("");
    setHorarioIntervaloInicio("");
    setHorarioIntervaloFim("");
  }

  return (
    <div>
      <form onSubmit={cadastrarBarbeiro} className="bg-white p-6 rounded shadow mb-6">
        <div className="mb-4">
          <label className="block mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Telefone</label>
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Especialidade</label>
          <input
            type="text"
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Foto (URL)</label>
          <input
            type="url"
            value={foto}
            onChange={(e) => setFoto(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="w-4 h-4"
          />
          <label>Ativo</label>
        </div>

        <div className="mb-4 p-4 rounded border bg-gray-50">
          <h3 className="font-semibold mb-3">Horários de atendimento</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {DIAS.map((dia) => {
              const selected = diasAtendimento.includes(String(dia.value));

              return (
                <button
                  type="button"
                  key={dia.value}
                  onClick={() => {
                    setDiasAtendimento((prev) =>
                      selected
                        ? prev.filter((item) => item !== String(dia.value))
                        : [...prev, String(dia.value)],
                    );
                  }}
                  className={`text-left rounded-lg border-2 p-3 transition-all cursor-pointer ${
                    selected
                      ? "border-black bg-gray-100 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm">{dia.label}</span>
                    {selected && (
                      <span className="text-black text-lg leading-none shrink-0">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mb-4">Nenhum marcado = disponível todos os dias</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1">Início</label>
              <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block mb-1">Fim</label>
              <input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block mb-1">Intervalo início</label>
              <input type="time" value={horarioIntervaloInicio} onChange={(e) => setHorarioIntervaloInicio(e.target.value)} className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block mb-1">Intervalo fim</label>
              <input type="time" value={horarioIntervaloFim} onChange={(e) => setHorarioIntervaloFim(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">
            {barbeiroEditando ? "Atualizar" : "Cadastrar"}
          </button>

          {barbeiroEditando && (
            <button type="button" onClick={limparFormulario} className="bg-gray-300 text-black px-4 py-2 rounded">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {barbeiros.map((barbeiro) => (
          <div key={barbeiro.id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
            {barbeiro.foto ? (
              <img
                src={barbeiro.foto}
                alt={barbeiro.nome}
                className="w-20 h-20 rounded object-cover bg-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                Sem foto
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {barbeiro.nome}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${barbeiro.ativo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                    >
                      {barbeiro.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </h2>
                  <p>{barbeiro.telefone || "Sem telefone"}</p>
                  <p>{barbeiro.especialidade || "Sem especialidade"}</p>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => editarBarbeiro(barbeiro)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => pedirConfirmacaoDeletar(barbeiro)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Tem certeza?</h3>
            <p className="mb-4">Tem certeza que deseja deletar este barbeiro?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelarDeletar} className="px-4 py-2 rounded border">
                Cancelar
              </button>

              <button onClick={confirmarDeletar} className="px-4 py-2 rounded bg-red-500 text-white">
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Barbeiros;
