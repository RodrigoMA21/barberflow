import { useEffect, useState } from "react";
import { api } from "../api";

function Dashboard() {
  const [resumo, setResumo] = useState({
    faturamento: 0,
    total_agendamentos: 0,
  });

  const [servicos, setServicos] = useState([]);
  const [seriesMensal, setSeriesMensal] = useState([]);
  const [indicadores, setIndicadores] = useState({});

  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const [ano, setAno] = useState(new Date().getFullYear());

  async function carregarDashboard() {
    const response = await api(
      `/dashboard?mes=${mes}&ano=${ano}`,
    );

    const data = await response.json();

    setResumo(data.resumo);
    setServicos(data.servicos);
    setSeriesMensal(data.series_mensal || []);
    setIndicadores(data.indicadores || {});
  }

  useEffect(() => {
    carregarDashboard();
  }, [mes, ano]);

  function formatCurrency(value) {
    return Number(value || 0).toFixed(2);
  }

  const resumoFinanceiro = [
    {
      label: "Faturamento do mês",
      value: Number(resumo.faturamento || 0),
      accent: "bg-black",
    },
    {
      label: "Faturamento de hoje",
      value: Number(resumo.faturamento_dia || 0),
      accent: "bg-gray-700",
    },
    {
      label: "Faturamento do ano",
      value: Number(resumo.faturamento_ano || 0),
      accent: "bg-emerald-600",
    },
  ];

  const maiorValorFinanceiro = Math.max(
    ...resumoFinanceiro.map((item) => item.value),
    0,
  );

  const mesesLabels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const maiorFaturamentoMensal = Math.max(
    ...seriesMensal.map((item) => Number(item.faturamento || 0)),
    0,
  );

  const serieMensalComVariacao = seriesMensal.map((item, index) => {
    const faturamento = Number(item.faturamento || 0);
    const anterior = index > 0 ? Number(seriesMensal[index - 1]?.faturamento || 0) : 0;
    const variacao = anterior > 0 ? ((faturamento - anterior) / anterior) * 100 : null;

    return {
      ...item,
      faturamento,
      variacao,
    };
  });

  function exportarCsv() {
    const linhas = [
      ["Tipo", "Campo", "Valor"],
      ["Resumo", "Mês", String(mes)],
      ["Resumo", "Ano", String(ano)],
      ["Resumo", "Faturamento Total", formatCurrency(resumo.faturamento)],
      ["Resumo", "Faturamento Hoje", formatCurrency(resumo.faturamento_dia)],
      ["Resumo", "Faturamento Ano", formatCurrency(resumo.faturamento_ano)],
      ["Resumo", "Total de Agendamentos", String(resumo.total_agendamentos || 0)],
      ["", "", ""],
      ["Tipo", "Nome", "Quantidade"],
      ...servicos.map((servico) => ["Serviço", servico.nome, String(servico.quantidade)]),
    ];

    const csv = linhas
      .map((linha) => linha.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-${ano}-${String(mes).padStart(2, "0")}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border p-2 rounded"
        >
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

        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="border p-2 rounded w-32"
        />

        <button
          type="button"
          onClick={exportarCsv}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Faturamento Total (Mês, concluídos)</h2>

          <p className="text-3xl font-bold mt-2">
            R$ {Number(resumo.faturamento).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Faturamento (Hoje, concluídos)</h2>

          <p className="text-3xl font-bold mt-2">
            R$ {Number(resumo.faturamento_dia || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Faturamento (Ano, concluídos)</h2>

          <p className="text-3xl font-bold mt-2">
            R$ {Number(resumo.faturamento_ano || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Total de Agendamentos</h2>

          <p className="text-3xl font-bold mt-2">{resumo.total_agendamentos}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Serviço mais vendido</h2>
          <p className="text-2xl font-bold mt-2">{indicadores.servico_mais_vendido || "—"}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Cliente que mais agendou</h2>
          <p className="text-2xl font-bold mt-2">{indicadores.cliente_que_mais_agendou || "—"}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Ticket médio</h2>
          <p className="text-2xl font-bold mt-2">R$ {Number(indicadores.ticket_medio || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Clientes cadastrados</h2>
          <p className="text-2xl font-bold mt-2">{indicadores.total_clientes || 0}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Barbeiros ativos</h2>
          <p className="text-2xl font-bold mt-2">{indicadores.total_barbeiros_ativos || 0}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500 text-sm">Atendimentos concluídos</h2>
          <p className="text-2xl font-bold mt-2">{indicadores.total_atendimentos_concluidos || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Comparativo de faturamento</h2>
          <span className="text-sm text-gray-500">mês, hoje e ano</span>
        </div>

        <div className="space-y-4">
          {resumoFinanceiro.map((item) => {
            const largura = maiorValorFinanceiro > 0 ? (item.value / maiorValorFinanceiro) * 100 : 0;

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span>R$ {formatCurrency(item.value)}</span>
                </div>

                <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.accent}`}
                    style={{ width: `${largura}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Faturamento mensal do ano</h2>
          <span className="text-sm text-gray-500">{ano}</span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-black" />
            <span>Mês com maior valor no ano selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-200 border border-gray-300" />
            <span>Comparação relativa entre os meses</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {serieMensalComVariacao.map((item, index) => {
            const largura = maiorFaturamentoMensal > 0 ? (Number(item.faturamento || 0) / maiorFaturamentoMensal) * 100 : 0;
            const barraPrincipal = index === new Date().getMonth() ? "bg-black" : "bg-gray-800";
            const variacaoTexto =
              item.variacao === null
                ? "Sem mês anterior para comparar"
                : `${item.variacao >= 0 ? "+" : ""}${item.variacao.toFixed(1)}% vs. mês anterior`;

            return (
              <div key={item.mes} className="rounded-xl border border-gray-200 p-3 bg-linear-to-b from-gray-50 to-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-gray-700">
                    {mesesLabels[item.mes - 1]}
                  </span>
                  <span className="text-xs text-gray-500">{String(item.mes).padStart(2, "0")}</span>
                </div>

                <div className="h-28 flex items-end">
                  <div className="w-full h-full flex items-end">
                    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex items-end" title={`R$ ${formatCurrency(item.faturamento)} | ${variacaoTexto}`}>
                      <div
                        className={`w-full ${barraPrincipal} rounded-lg transition-all`}
                        style={{ height: `${largura}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500">Faturamento</span>
                  <strong className="text-right">R$ {formatCurrency(item.faturamento)}</strong>
                </div>

                <div className="mt-1 text-xs text-gray-500">{variacaoTexto}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Serviços Mais Realizados</h2>

        <div className="space-y-3">
          {servicos.map((servico) => (
            <div
              key={servico.nome}
              className="flex justify-between border-b pb-2"
            >
              <span>{servico.nome}</span>

              <span>{servico.quantidade}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
