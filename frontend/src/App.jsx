import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Toaster, toast } from 'sonner' 
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { 
  Wallet, AlertCircle, Filter, Search, Plus, X, Pencil, Trash2, 
  Banknote, SlidersHorizontal, Calendar, 
  PieChart, BarChart3, TrendingUp, CreditCard, Coins // Novos ícones importados
} from 'lucide-react';

ChartJS.defaults.color = '#a1a1aa'; 
ChartJS.defaults.borderColor = '#27272a';
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
  BarElement, PointElement, LineElement, Title
);

// --- CONFIGURAÇÃO DE DEPLOY ---
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
// ------------------------------

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [listaGastos, setListaGastos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [tipoGrafico, setTipoGrafico] = useState('bar'); 
  const [idEdicao, setIdEdicao] = useState(null); 

  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);

  const [novoGasto, setNovoGasto] = useState({
    valor: '',
    descricao: '',
    data: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    categoria: 'Outros',
    metodo_pagamento: 'Crédito',
    parcelas: 1
  });

  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1); 
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDescricao, setFiltroDescricao] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");
  const [filtroValorMin, setFiltroValorMin] = useState("");
  const [filtroValorMax, setFiltroValorMax] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const listaMeses = [
    { num: 1, nome: 'Janeiro' }, { num: 2, nome: 'Fevereiro' }, { num: 3, nome: 'Março' },
    { num: 4, nome: 'Abril' }, { num: 5, nome: 'Maio' }, { num: 6, nome: 'Junho' },
    { num: 7, nome: 'Julho' }, { num: 8, nome: 'Agosto' }, { num: 9, nome: 'Setembro' },
    { num: 10, nome: 'Outubro' }, { num: 11, nome: 'Novembro' }, { num: 12, nome: 'Dezembro' }
  ];

  const listaCategorias = [
    "Investimento", "Alimentação", "Gastos Fixos", 
    "Gastos Extras", "Transporte", "Compras", "Outros"
  ];

  async function buscarDados() {
    setCarregando(true);
    try {
      const usarDatasPersonalizadas = filtroDataInicio || filtroDataFim;
      const paramsCompletos = {
        mes: usarDatasPersonalizadas ? null : filtroMes,
        ano: usarDatasPersonalizadas ? null : filtroAno,
        categoria: filtroCategoria || null,
        descricao: filtroDescricao || null,
        metodo_pagamento: filtroMetodo || null,
        valor_inicio: filtroValorMin || null,
        valor_fim: filtroValorMax || null,
        data_inicio: filtroDataInicio || null,
        data_fim: filtroDataFim || null
      };

      const [respDash, respGastos] = await Promise.all([
        axios.get(`${API_URL}/dashboard`, { params: paramsCompletos }),
        axios.get(`${API_URL}/gastos`, { params: paramsCompletos })
      ]);

      setDashboardData(respDash.data);

      // ORDENAÇÃO POR DATA (Antigo -> Novo)
      // Se quiser o contrário (Mais recente no topo), inverta para: (b.data > a.data ? 1 : -1)
      const gastosOrdenados = respGastos.data.sort((a, b) => {
        if (a.data < b.data) return -1;
        if (a.data > b.data) return 1;
        return 0;
      });

      setListaGastos(gastosOrdenados);
      
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  const dadosCategorias = useMemo(() => {
    const categorias = Object.keys(dashboardData?.total_categoria || {});
    const valores = Object.values(dashboardData?.total_categoria || {});
    return {
      labels: categorias,
      datasets: [{
        label: 'Gastos R$',
        data: valores,
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
        borderColor: '#18181b',
        borderWidth: 2,
        borderRadius: 4,
        hoverOffset: 10
      }],
    };
  }, [dashboardData]);

  const dadosLinha = useMemo(() => {
    const gastosPorDia = listaGastos.reduce((acc, gasto) => {
      const dia = gasto.data.split('-')[2]; 
      acc[dia] = (acc[dia] || 0) + gasto.valor;
      return acc;
    }, {});

    const diasOrdenados = Object.keys(gastosPorDia).sort();
    const valoresPorDia = diasOrdenados.map(dia => gastosPorDia[dia]);

    return {
      labels: diasOrdenados,
      datasets: [{
        label: 'Gasto Diário',
        data: valoresPorDia,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        fill: true
      }]
    };
  }, [listaGastos]);

  const opcoesRosca = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: {
      legend: {
        position: 'right', 
        labels: {
          color: '#fff',
          font: { size: 12 },
          padding: 20,
          usePointStyle: true,
        }
      }
    }
  };

  const opcoesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: '#27272a' } },
      x: { grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  const opcoesLinha = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: '#27272a' }, beginAtZero: true },
      x: { grid: { display: false }, title: { display: true, text: 'Dia do Mês' } }
    },
    plugins: { legend: { display: false } }
  };

  function limparFiltrosAvancados() {
    setFiltroDescricao(""); setFiltroMetodo(""); setFiltroValorMin("");
    setFiltroValorMax(""); setFiltroDataInicio(""); setFiltroDataFim("");
    buscarDados();
  }

  async function enviarGasto(e) {
    e.preventDefault();
    try {
      if (idEdicao) {
        const { parcelas, ...dadosParaAtualizar } = novoGasto; 
        await axios.patch(`${API_URL}/gastos/${idEdicao}`, dadosParaAtualizar);
        toast.success("Gasto atualizado!");
      } else {
        await axios.post(`${API_URL}/gastos`, novoGasto);
        toast.success("Gasto adicionado!");
      }
      fecharModal();
      buscarDados(); 
    } catch (erro) {
      toast.error("Erro ao salvar.");
    }
  }

  function excluirGasto(id) {
    toast("Confirmar exclusão?", {
      action: {
        label: 'Excluir',
        onClick: async () => {
          try {
            await axios.delete(`${API_URL}/gastos/${id}`);
            toast.success("Gasto removido!");
            buscarDados();
          } catch (erro) { toast.error("Erro ao excluir."); }
        },
      },
      cancel: { label: 'Cancelar' },
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });
  }

  function prepararEdicao(gasto) {
    setIdEdicao(gasto.id);
    setNovoGasto({ ...gasto, parcelas: 1 });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setIdEdicao(null);
    setNovoGasto({
      valor: '', descricao: '', data: new Date().toISOString().split('T')[0],
      categoria: 'Outros', metodo_pagamento: 'Crédito', parcelas: 1
    });
  }

  useEffect(() => { buscarDados(); }, []);

  // Cálculos para os Cards Novos
  const totalGeral = dashboardData?.total_gastos || 0;
  const totalFatura = dashboardData?.total_fatura || 0;
  const totalExtras = dashboardData?.total_categoria['Gastos Extras'] || 0;
  // Gastos Comuns = Tudo - Extras
  const totalComuns = totalGeral - totalExtras;

  const inputStyle = "w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-emerald-500 text-white transition-colors placeholder-zinc-500";
  const labelStyle = "block text-sm font-medium text-zinc-400 mb-1";

  return (
    <div className="min-h-screen p-8 font-sans text-zinc-100 bg-zinc-950 relative">
      <Toaster position="top-right" theme="dark" richColors />

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Meu Controle Financeiro</h1>
          <div className="text-sm text-zinc-400 mt-1">
            Visualizando: <strong className="text-emerald-400">{(filtroDataInicio || filtroDataFim) ? 'Período Personalizado' : `${filtroMes}/${filtroAno}`}</strong>
          </div>
        </div>
        <button onClick={() => { setIdEdicao(null); setModalAberto(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
          <Plus size={20} /> Novo Gasto
        </button>
      </div>

      {/* CARDS REORGANIZADOS (4 Colunas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Total Geral */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <Banknote size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Total do Mês</p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Card 2: Fatura */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <CreditCard size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Fatura (Cartão)</p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalFatura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Card 3: Gastos Comuns (Sem Extras) */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <Coins size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Gastos Comuns</p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalComuns.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Card 4: Gastos Extras */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <AlertCircle size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Gastos Extras</p>
            <p className="text-2xl font-bold text-emerald-400">
               {totalExtras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

      </div>

      {/* ÁREA PRINCIPAL (Gráfico e Filtros) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* ÁREA DO GRÁFICO */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Análise Visual</h2>
            
            <div className="flex bg-zinc-800 p-1 rounded-lg gap-1">
              <button onClick={() => setTipoGrafico('bar')} className={`p-2 rounded transition-colors ${tipoGrafico === 'bar' ? 'bg-zinc-700 text-emerald-400' : 'text-zinc-400 hover:text-white'}`} title="Comparação (Barras)">
                <BarChart3 size={18} />
              </button>
              <button onClick={() => setTipoGrafico('doughnut')} className={`p-2 rounded transition-colors ${tipoGrafico === 'doughnut' ? 'bg-zinc-700 text-emerald-400' : 'text-zinc-400 hover:text-white'}`} title="Categorias (Rosca)">
                <PieChart size={18} />
              </button>
              <button onClick={() => setTipoGrafico('line')} className={`p-2 rounded transition-colors ${tipoGrafico === 'line' ? 'bg-zinc-700 text-emerald-400' : 'text-zinc-400 hover:text-white'}`} title="Evolução (Linha)">
                <TrendingUp size={18} />
              </button>
            </div>
          </div>

          <div className="h-[350px] w-full relative">
             {dashboardData ? (
                <>
                  {tipoGrafico === 'doughnut' && <Doughnut data={dadosCategorias} options={opcoesRosca} />}
                  {tipoGrafico === 'bar' && <Bar data={dadosCategorias} options={opcoesBarra} />}
                  {tipoGrafico === 'line' && <Line data={dadosLinha} options={opcoesLinha} />}
                </>
             ) : (
                <div className="flex items-center justify-center h-full text-zinc-500">Carregando dados...</div>
             )}
          </div>
        </div>

        {/* ÁREA DE FILTROS */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 h-fit">
          <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="text-emerald-500" size={20}/>
              <h2 className="text-lg font-bold text-white">Filtros</h2>
            </div>
            <button onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)} className={`p-2 rounded-lg transition-colors ${mostrarFiltrosAvancados ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              <SlidersHorizontal size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className={filtroDataInicio || filtroDataFim ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
              <div><label className={labelStyle}>Mês</label><select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} className={inputStyle}>{listaMeses.map(mes => <option key={mes.num} value={mes.num} className="bg-zinc-800">{mes.nome}</option>)}</select></div>
              <div className="mt-4"><label className={labelStyle}>Ano</label><input type="number" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} className={inputStyle}/></div>
            </div>
            <div><label className={labelStyle}>Categoria</label><select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={inputStyle}><option value="" className="bg-zinc-800">Todas</option>{listaCategorias.map(cat => <option key={cat} value={cat} className="bg-zinc-800">{cat}</option>)}</select></div>

            {mostrarFiltrosAvancados && (
              <div className="pt-4 mt-4 border-t border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-4">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Avançado</p>
                <input type="text" value={filtroDescricao} onChange={(e) => setFiltroDescricao(e.target.value)} placeholder="Descrição contém..." className={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Min R$" value={filtroValorMin} onChange={(e) => setFiltroValorMin(e.target.value)} className={inputStyle} />
                  <input type="number" placeholder="Max R$" value={filtroValorMax} onChange={(e) => setFiltroValorMax(e.target.value)} className={inputStyle} />
                </div>
                <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={inputStyle}><option value="">Todos Métodos</option><option value="Crédito">Crédito</option><option value="Débito">Débito</option></select>
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2 text-zinc-400"><Calendar size={14} /><span className="text-xs font-bold uppercase">Período Exato</span></div>
                  <div className="space-y-2">
                     <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className={`${inputStyle} text-sm py-2`} />
                     <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className={`${inputStyle} text-sm py-2`} />
                  </div>
                </div>
                <button onClick={limparFiltrosAvancados} className="text-xs text-red-400 hover:text-red-300 underline w-full text-center">Limpar Filtros</button>
              </div>
            )}
            <button onClick={buscarDados} disabled={carregando} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">{carregando ? '...' : <><Search size={18}/> Filtrar</>}</button>
          </div>
        </div>
      </div>

      {/* TABELA DE GASTOS */}
      <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Extrato</h2>
          <span className="text-sm text-zinc-500">{listaGastos.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="p-4 text-sm font-medium text-zinc-400">Data</th>
                <th className="p-4 text-sm font-medium text-zinc-400">Descrição</th>
                <th className="p-4 text-sm font-medium text-zinc-400">Categoria</th>
                <th className="p-4 text-sm font-medium text-zinc-400">Valor</th>
                <th className="p-4 text-sm font-medium text-zinc-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {listaGastos.length > 0 ? (listaGastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="p-4 text-sm text-zinc-300">{gasto.data.split('-').reverse().slice(0, 2).join('/')}</td>
                    <td className="p-4 text-sm font-medium text-white">{gasto.descricao}</td>
                    <td className="p-4 text-sm text-zinc-300"><span className="px-2 py-1 bg-zinc-800 rounded text-xs border border-zinc-700">{gasto.categoria}</span></td>
                    <td className="p-4 text-sm font-bold text-emerald-400">{gasto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 text-sm flex justify-center gap-2">
                      <button onClick={() => prepararEdicao(gasto)} className="p-2 text-emerald-500 hover:bg-zinc-800 rounded-full transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => excluirGasto(gasto.id)} className="p-2 text-red-400 hover:bg-zinc-800 rounded-full transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))) : (<tr><td colSpan="5" className="p-8 text-center text-zinc-500">Nenhum gasto encontrado.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-bounce-in border border-zinc-800">
            <button onClick={fecharModal} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{idEdicao ? 'Editar' : 'Novo Gasto'}</h2>
            <form onSubmit={enviarGasto} className="space-y-4">
              <div><label className={labelStyle}>Valor</label><input type="number" step="0.01" required value={novoGasto.valor} onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})} className={inputStyle} placeholder="0.00" /></div>
              <div><label className={labelStyle}>Descrição</label><input type="text" required value={novoGasto.descricao} onChange={e => setNovoGasto({...novoGasto, descricao: e.target.value})} className={inputStyle} placeholder="Ex: Almoço" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Data</label><input type="date" required value={novoGasto.data} onChange={e => setNovoGasto({...novoGasto, data: e.target.value})} className={inputStyle} /></div>
                {!idEdicao && (<div><label className={labelStyle}>Parcelas</label><input type="number" min="1" max="48" value={novoGasto.parcelas} onChange={e => setNovoGasto({...novoGasto, parcelas: e.target.value})} className={inputStyle} /></div>)}
              </div>
              <div><label className={labelStyle}>Categoria</label><select value={novoGasto.categoria} onChange={e => setNovoGasto({...novoGasto, categoria: e.target.value})} className={inputStyle}>{listaCategorias.map(cat => <option key={cat} value={cat} className="bg-zinc-800">{cat}</option>)}</select></div>
              <div>
                <label className={labelStyle}>Método</label>
                <div className="flex gap-4 text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white"><input type="radio" name="metodo" value="Crédito" checked={novoGasto.metodo_pagamento === 'Crédito'} onChange={e => setNovoGasto({...novoGasto, metodo_pagamento: e.target.value})} className="accent-emerald-500"/> Crédito</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white"><input type="radio" name="metodo" value="Débito" checked={novoGasto.metodo_pagamento === 'Débito'} onChange={e => setNovoGasto({...novoGasto, metodo_pagamento: e.target.value})} className="accent-emerald-500"/> Débito</label>
                </div>
              </div>
              <button type="submit" className={`w-full text-zinc-950 font-bold py-3 rounded-lg mt-4 transition-colors shadow-lg bg-emerald-500 hover:bg-emerald-600`}>{idEdicao ? 'Salvar Alterações' : 'Adicionar Gasto'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App