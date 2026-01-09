import { useState, useEffect } from 'react'
import axios from 'axios'
import { Toaster, toast } from 'sonner' 
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Wallet, AlertCircle, Filter, Search, Plus, X, Pencil, Trash2, Banknote, ArrowRightLeft } from 'lucide-react'; 

ChartJS.defaults.color = '#a1a1aa'; 
ChartJS.defaults.borderColor = '#3f3f46';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- CONFIGURAÇÃO DE DEPLOY ---
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
// ------------------------------

function App() {
  // --- ESTADOS GERAIS ---
  const [dashboardData, setDashboardData] = useState(null);
  const [listaGastos, setListaGastos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [graficoTipoBarra, setGraficoTipoBarra] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null); 

  // --- ESTADOS DO FORMULÁRIO ---
  const [novoGasto, setNovoGasto] = useState({
    valor: '',
    descricao: '',
    data: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    categoria: 'Outros',
    metodo_pagamento: 'Crédito',
    parcelas: 1
  });

  // --- ESTADOS DOS FILTROS ---
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1); 
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroCategoria, setFiltroCategoria] = useState("");

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

  // --- FUNÇÕES ---
  async function buscarDados() {
    try {
      const paramsGerais = { mes: filtroMes, ano: filtroAno };
      const paramsTabela = { ...paramsGerais, categoria: filtroCategoria || null };

      // CORREÇÃO 1: Usando API_URL aqui
      const respDash = await axios.get(`${API_URL}/dashboard`, { params: paramsGerais });
      setDashboardData(respDash.data);

      // CORREÇÃO 2: Usando API_URL aqui
      const respGastos = await axios.get(`${API_URL}/gastos`, { params: paramsTabela });
      setListaGastos(respGastos.data);
      
    } catch (erro) {
      console.error("Erro ao buscar dados:", erro);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function enviarGasto(e) {
    e.preventDefault();
    try {
      if (idEdicao) {
        const { parcelas, ...dadosParaAtualizar } = novoGasto; 
        // CORREÇÃO 3: Usando API_URL aqui
        await axios.patch(`${API_URL}/gastos/${idEdicao}`, dadosParaAtualizar);
        toast.success("Gasto atualizado com sucesso!");
      } else {
        // CORREÇÃO 4: Usando API_URL aqui
        await axios.post(`${API_URL}/gastos`, novoGasto);
        toast.success("Gasto adicionado com sucesso!");
      }
      fecharModal();
      buscarDados(); 
    } catch (erro) {
      console.error(erro);
      toast.error("Erro ao salvar. Verifique os dados.");
    }
  }

  function excluirGasto(id) {
    toast("Tem certeza que deseja excluir?", {
      action: {
        label: 'Sim, Excluir',
        onClick: async () => {
          try {
            // CORREÇÃO 5: Usando API_URL aqui
            await axios.delete(`${API_URL}/gastos/${id}`);
            toast.success("Gasto removido!");
            buscarDados();
          } catch (erro) {
            toast.error("Erro ao excluir item.");
          }
        },
      },
      cancel: { label: 'Cancelar' },
      duration: 5000,
      style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
    });
  }

  function prepararEdicao(gasto) {
    setIdEdicao(gasto.id);
    setNovoGasto({
      valor: gasto.valor,
      descricao: gasto.descricao,
      data: gasto.data,
      categoria: gasto.categoria,
      metodo_pagamento: gasto.metodo_pagamento,
      parcelas: 1
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setIdEdicao(null);
    setNovoGasto({
      valor: '',
      descricao: '',
      data: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      categoria: 'Outros',
      metodo_pagamento: 'Crédito',
      parcelas: 1
    });
  }

  useEffect(() => {
    buscarDados();
  }, []);

  const categoriasGrafico = Object.keys(dashboardData?.total_categoria || {});
  const valoresGrafico = Object.values(dashboardData?.total_categoria || {});
  
  const dadosGrafico = {
    labels: categoriasGrafico,
    datasets: [{
      label: 'Gastos R$',
      data: valoresGrafico,
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
      borderRadius: 5,
      borderWidth: 0, 
    }],
  };

  const opcoesBarra = {
    responsive: true,
    scales: {
      x: { ticks: { color: '#a1a1aa' }, grid: { color: '#27272a' } },
      y: { ticks: { color: '#a1a1aa' }, grid: { color: '#27272a' } }
    },
    plugins: {
      legend: { display: false },
      title: { display: false }
    }
  };

  const opcoesPizza = {
    plugins: { 
      legend: { 
        labels: { color: '#fff' } 
      } 
    } 
  };

  const inputStyle = "w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-emerald-500 text-white transition-colors";
  const labelStyle = "block text-sm font-medium text-zinc-400 mb-1";

  return (
    <div className="min-h-screen p-8 font-sans text-zinc-100 bg-zinc-950 relative">
      
      <Toaster position="top-right" theme="dark" richColors />

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Meu Controle Financeiro</h1>
          <div className="text-sm text-zinc-400 mt-1">
            Exibindo dados de: <strong className="text-emerald-400">{filtroMes}/{filtroAno}</strong>
          </div>
        </div>

        <button 
          onClick={() => { setIdEdicao(null); setModalAberto(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Plus size={20} />
          Novo Gasto
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Fatura */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <Wallet size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Fatura (Cartão)</p>
            <p className="text-2xl font-bold text-emerald-400">
              {dashboardData?.total_fatura?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Mês */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <Banknote size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Total do Mês</p>
            <p className="text-2xl font-bold text-emerald-400">
              {dashboardData?.total_gastos?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
            </p>
          </div>
        </div>

        {/* Card 3: Gastos Extras */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 flex items-center">
          <div className="p-3 bg-emerald-950/50 rounded-full mr-4 text-emerald-400"> <AlertCircle size={32} /> </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Gastos Extras</p>
            <p className="text-2xl font-bold text-emerald-400">
               {(dashboardData?.total_categoria['Gastos Extras'] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DO GRÁFICO E FILTROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-center w-full text-white">Distribuição dos Gastos</h2>
            <button 
              onClick={() => setGraficoTipoBarra(!graficoTipoBarra)}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Trocar tipo de gráfico"
            >
              <ArrowRightLeft size={20} />
            </button>
          </div>

          <div className="h-64 flex justify-center w-full">
             {dashboardData ? (
                graficoTipoBarra ? 
                  <Bar key="grafico-barra" data={dadosGrafico} options={opcoesBarra} /> 
                  : 
                  <Pie key="grafico-pizza" data={dadosGrafico} options={opcoesPizza} />
             ) : (
                <p className="text-zinc-500">Carregando...</p>
             )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800 h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
            <Filter className="text-emerald-500" size={20}/>
            <h2 className="text-lg font-bold text-white">Filtrar Dados</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Mês</label>
              <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} className={inputStyle}>
                {listaMeses.map(mes => <option key={mes.num} value={mes.num} className="bg-zinc-800">{mes.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Ano</label>
              <input type="number" value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} className={inputStyle}/>
            </div>
            <div>
              <label className={labelStyle}>Categoria</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={inputStyle}>
                <option value="" className="bg-zinc-800">Todas</option>
                {listaCategorias.map(cat => <option key={cat} value={cat} className="bg-zinc-800">{cat}</option>)}
              </select>
            </div>
            <button onClick={buscarDados} disabled={carregando} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              {carregando ? 'Buscando...' : <><Search size={18}/> Atualizar</>}
            </button>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-800"><h2 className="text-lg font-bold text-white">Detalhamento</h2></div>
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
              {listaGastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="p-4 text-sm text-zinc-300">
                    {gasto.data.split('-').reverse().slice(0, 2).join('/')}
                  </td>
                  <td className="p-4 text-sm font-medium text-white">{gasto.descricao}</td>
                  <td className="p-4 text-sm text-zinc-300"><span className="px-2 py-1 bg-zinc-800 rounded text-xs border border-zinc-700">{gasto.categoria}</span></td>
                  <td className="p-4 text-sm font-bold text-emerald-400">{gasto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-4 text-sm flex justify-center gap-2">
                    <button onClick={() => prepararEdicao(gasto)} className="p-2 text-emerald-500 hover:bg-zinc-800 rounded-full transition-colors"><Pencil size={18} /></button>
                    <button onClick={() => excluirGasto(gasto.id)} className="p-2 text-red-400 hover:bg-zinc-800 rounded-full transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-bounce-in border border-zinc-800">
            <button onClick={fecharModal} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-white mb-6">{idEdicao ? 'Editar Gasto' : 'Novo Gasto'}</h2>
            <form onSubmit={enviarGasto} className="space-y-4">
              <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" required value={novoGasto.valor} onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})} className={inputStyle} placeholder="0.00" /></div>
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
              <button type="submit" className={`w-full text-zinc-950 font-bold py-3 rounded-lg mt-4 transition-colors shadow-lg bg-emerald-500 hover:bg-emerald-600`}>
                {idEdicao ? 'Atualizar Gasto' : 'Salvar Gasto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App