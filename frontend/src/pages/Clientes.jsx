import { useEffect, useState } from "react";
import { api } from "../api";
import { useNotify } from "../components/Notification";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cartoesPorCliente, setCartoesPorCliente] = useState({});
  const [historicoPorCliente, setHistoricoPorCliente] = useState({});
  const [clienteAbertoId, setClienteAbertoId] = useState(null);
  const notify = useNotify();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null);
  const [cartaoFidelidadeAtivo, setCartaoFidelidadeAtivo] = useState(false);
  const [cartaoFidelidadeCarimbos, setCartaoFidelidadeCarimbos] = useState(0);
  const [cartaoFidelidadeMeta, setCartaoFidelidadeMeta] = useState(10);
  const [cartaoDrafts, setCartaoDrafts] = useState({});

  async function carregarClientes() {
    const response = await api("/clientes");

    const data = await response.json();

    setClientes(data);
  }

  async function carregarCartaoFidelidade(clienteId) {
    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`);
    const data = await response.json();

    setCartoesPorCliente((prev) => ({
      ...prev,
      [clienteId]: Array.isArray(data) ? data : [],
    }));
  }

  async function carregarHistoricoCliente(clienteId) {
    const response = await api(
      `/agendamentos/historico?cliente_id=${clienteId}&page=1&limit=20`,
    );
    const data = await response.json();

    setHistoricoPorCliente((prev) => ({
      ...prev,
      [clienteId]: Array.isArray(data.data) ? data.data : [],
    }));
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function cadastrarCliente(e) {
    e.preventDefault();

    const clienteData = {
      nome,
      telefone,
      email,
      cpf,
      cartao_fidelidade_ativo: cartaoFidelidadeAtivo,
      cartao_fidelidade_carimbos: cartaoFidelidadeCarimbos,
      cartao_fidelidade_meta: cartaoFidelidadeMeta,
    };

    if (clienteEditando) {
      await api(`/clientes/${clienteEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      });

      setClienteEditando(null);
    } else {
      await api("/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      });
    }

    setNome("");
    setTelefone("");
    setEmail("");
    setCpf("");
    setCartaoFidelidadeAtivo(false);
    setCartaoFidelidadeCarimbos(0);
    setCartaoFidelidadeMeta(10);

    carregarClientes();
  }

  async function deletarCliente(id) {
    await api(`/clientes/${id}`, {
      method: "DELETE",
    });

    carregarClientes();
  }

  function pedirConfirmacaoDeletar(cliente) {
    setClienteParaDeletar(cliente);
    setShowConfirm(true);
  }

  async function confirmarDeletar() {
    if (!clienteParaDeletar) return;

    await deletarCliente(clienteParaDeletar.id);

    setShowConfirm(false);
    setClienteParaDeletar(null);
  }

  function cancelarDeletar() {
    setShowConfirm(false);
    setClienteParaDeletar(null);
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente);

    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setEmail(cliente.email || "");
    setCpf(cliente.cpf || "");
    setCartaoFidelidadeAtivo(Boolean(cliente.cartao_fidelidade_ativo));
    setCartaoFidelidadeCarimbos(Number(cliente.cartao_fidelidade_carimbos) || 0);
    setCartaoFidelidadeMeta(Number(cliente.cartao_fidelidade_meta) || 10);
  }

  function limparFormulario() {
    setClienteEditando(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setCpf("");
    setCartaoFidelidadeAtivo(false);
    setCartaoFidelidadeCarimbos(0);
    setCartaoFidelidadeMeta(10);
  }

  async function adicionarAtendimentoNoCartao(clienteId) {
    const draft = cartaoDrafts[clienteId] || {};

    if (!draft.dataAtendimento) {
      notify("Informe a data do atendimento");
      return;
    }

    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data_atendimento: draft.dataAtendimento,
        observacao: draft.observacao || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao adicionar atendimento");
      return;
    }

    setCartaoDrafts((prev) => ({
      ...prev,
      [clienteId]: { dataAtendimento: "", observacao: "" },
    }));
    carregarCartaoFidelidade(clienteId);
    carregarClientes();
  }

  async function limparCartaoFidelidade(clienteId) {
    const confirmar = window.confirm("Tem certeza que deseja limpar o cartão fidelidade deste cliente?");

    if (!confirmar) return;

    const response = await api(`/clientes/${clienteId}/cartao-fidelidade`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      notify(errorData.error || "Erro ao limpar cartão fidelidade");
      return;
    }

    carregarCartaoFidelidade(clienteId);
    carregarClientes();
  }

  function formatarDataBR(data) {
    if (!data) return "";

    const raw = data.includes("T") ? data.split("T")[0] : data;
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatarDataHoraBR(data) {
    if (!data) return "";

    const parsed = new Date(data);

    if (Number.isNaN(parsed.getTime())) {
      return String(data);
    }

    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function abrirOuFecharCliente(cliente) {
    const novoAbertoId = clienteAbertoId === cliente.id ? null : cliente.id;
    setClienteAbertoId(novoAbertoId);

    if (novoAbertoId) {
      await carregarCartaoFidelidade(cliente.id);
      await carregarHistoricoCliente(cliente.id);
    }
  }

  return (
    <div>
      <form
        onSubmit={cadastrarCliente}
        className="bg-white p-6 rounded shadow mb-6"
      >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">CPF</label>

            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="mb-4 p-4 rounded border bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold">Cartão fidelidade</h3>
              <p className="text-sm text-gray-500">Controle de carimbos e meta de recompensa.</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cartaoFidelidadeAtivo}
                onChange={(e) => setCartaoFidelidadeAtivo(e.target.checked)}
              />
              Ativo
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Carimbos atuais</label>

              <input
                type="number"
                min="0"
                value={cartaoFidelidadeCarimbos}
                onChange={(e) => setCartaoFidelidadeCarimbos(Number(e.target.value) || 0)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block mb-1">Meta de carimbos</label>

              <input
                type="number"
                min="1"
                value={cartaoFidelidadeMeta}
                onChange={(e) => setCartaoFidelidadeMeta(Number(e.target.value) || 10)}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <div className="mt-4 rounded bg-white p-4 border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Progresso do cartão</span>
              <span>
                {cartaoFidelidadeCarimbos}/{cartaoFidelidadeMeta}
              </span>
            </div>

            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-black"
                style={{
                  width: `${Math.min(
                    100,
                    (Number(cartaoFidelidadeCarimbos) / Math.max(Number(cartaoFidelidadeMeta), 1)) * 100,
                  )}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Use este cartão para conceder descontos ou bonificações manuais quando o cliente atingir a meta.
            </p>
          </div>
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {clienteEditando ? "Atualizar" : "Cadastrar"}
        </button>

        {clienteEditando && (
          <button
            type="button"
            onClick={limparFormulario}
            className="ml-3 bg-gray-300 text-black px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}
      </form>

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white p-4 rounded shadow">
            <button
              type="button"
              onClick={() => abrirOuFecharCliente(cliente)}
              className="text-left w-full"
            >
              <h2 className="text-xl font-semibold text-black hover:text-gray-700">
                {cliente.nome}
              </h2>
            </button>

            <p>{cliente.telefone}</p>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <span
                className={`px-2 py-1 rounded-full font-medium ${
                  cliente.cartao_fidelidade_ativo
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {cliente.cartao_fidelidade_ativo ? "Ativo" : "Inativo"}
              </span>

              <span className="text-gray-600">
                {Number(cliente.cartao_fidelidade_carimbos) || 0}/{Number(cliente.cartao_fidelidade_meta) || 10}
              </span>
            </div>

            <button
              onClick={() => pedirConfirmacaoDeletar(cliente)}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
            >
              Deletar
            </button>

            <button
              onClick={() => editarCliente(cliente)}
              className="mt-3 ml-3 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Editar
            </button>

            {clienteAbertoId === cliente.id && (
              <div className="mt-4 border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded p-3">
                    <span className="block text-xs text-gray-500">Email</span>
                    <strong>{cliente.email || "—"}</strong>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <span className="block text-xs text-gray-500">CPF</span>
                    <strong>{cliente.cpf || "—"}</strong>
                  </div>

                  <div className="bg-gray-50 rounded p-3">
                    <span className="block text-xs text-gray-500">Data de cadastro</span>
                    <strong>{formatarDataBR(cliente.created_at)}</strong>
                  </div>
                </div>

                <div className="rounded border bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold">Cartão fidelidade</h3>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => carregarCartaoFidelidade(cliente.id)}
                        className="bg-gray-200 text-black px-3 py-2 rounded text-sm"
                      >
                        Atualizar
                      </button>

                      <button
                        type="button"
                        onClick={() => limparCartaoFidelidade(cliente.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm"
                      >
                        Limpar cartão
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="date"
                      value={cartaoDrafts[cliente.id]?.dataAtendimento || ""}
                      onChange={(e) =>
                        setCartaoDrafts((prev) => ({
                          ...prev,
                          [cliente.id]: {
                            ...(prev[cliente.id] || {}),
                            dataAtendimento: e.target.value,
                          },
                        }))
                      }
                      className="w-full border p-2 rounded"
                    />

                    <input
                      type="text"
                      value={cartaoDrafts[cliente.id]?.observacao || ""}
                      onChange={(e) =>
                        setCartaoDrafts((prev) => ({
                          ...prev,
                          [cliente.id]: {
                            ...(prev[cliente.id] || {}),
                            observacao: e.target.value,
                          },
                        }))
                      }
                      placeholder="Observação opcional"
                      className="w-full border p-2 rounded md:col-span-1"
                    />

                    <button
                      type="button"
                      onClick={() => adicionarAtendimentoNoCartao(cliente.id)}
                      className="bg-black text-white px-4 py-2 rounded"
                    >
                      Adicionar data
                    </button>
                  </div>

                  <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${
                        cliente.cartao_fidelidade_ativo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {cliente.cartao_fidelidade_ativo ? "Ativo" : "Inativo"}
                    </span>

                    <span>
                      {Number(cliente.cartao_fidelidade_carimbos) || 0}/{Number(cliente.cartao_fidelidade_meta) || 10}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(cartoesPorCliente[cliente.id] || []).length > 0 ? (
                      cartoesPorCliente[cliente.id].map((registro) => (
                        <div key={registro.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-white">
                          <span>{formatarDataBR(registro.data_atendimento)}</span>
                          <span className="text-gray-500">{registro.observacao || "Sem observação"}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum registro no cartão.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded border p-4">
                  <div className="mb-2 text-sm text-gray-500">
                    Histórico recente de agendamentos deste cliente.
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Histórico de agendamentos</h3>

                    <div className="space-y-2">
                      {(historicoPorCliente[cliente.id] || []).length > 0 ? (
                        historicoPorCliente[cliente.id].map((agendamento) => (
                          <div key={agendamento.id} className="rounded border p-3 bg-gray-50 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <strong>{formatarDataHoraBR(`${agendamento.data}T${agendamento.horario}`)}</strong>
                              <span>{agendamento.status}</span>
                            </div>

                            <div className="mt-1 text-gray-600">
                              {agendamento.servicos?.map((servico) => servico.nome).join(", ") || "—"}
                            </div>

                            <div className="mt-1 text-gray-600">
                              Valor final: R$ {Number(agendamento.valor_final ?? agendamento.total ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum agendamento encontrado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Tem certeza?</h3>
            <p className="mb-4">Tem certeza que deseja deletar este cliente?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarDeletar}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarDeletar}
                className="px-4 py-2 rounded bg-red-500 text-white"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
