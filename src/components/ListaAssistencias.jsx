import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTools, FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';

function ListaAssistencias() {
  const navigate = useNavigate();
  
  const statusOptions = [
    { nome: 'EM ABERTO', cor: 'Amarelo', hex: '#FFEB3B' },
    { nome: 'ENVIADA', cor: 'Roxo', hex: '#9C27B0' },
    { nome: 'ENCOMENDADA', cor: 'Turquesa', hex: '#00B8A9' },
    { nome: 'VISITA TÉC.', cor: 'Magenta escuro', hex: '#C2185B' },
    { nome: 'AGENDAR', cor: 'Laranja', hex: '#FF9800' },
    { nome: 'AGENDADA', cor: 'Azul claro', hex: '#2196F3' },
    { nome: 'CONCLUÍDA', cor: 'Verde', hex: '#4CAF50' },
    { nome: 'CANCELADA', cor: 'Vermelho', hex: '#F44336' },
    { nome: 'AGUARDANDO ALGO', cor: 'Cinza', hex: '#9E9E9E' },
    { nome: 'INDEFINIDO', cor: 'Marrom', hex: '#795548' }
  ];

  const [assistencias, setAssistencias] = useState([
    {
      id: 1,
      dataAbertura: '01/01/2024',
      status: 'EM ABERTO',
      pedido: 'PED-001',
      oc: 'OC-001',
      vendedor: 'João Silva',
      cliente: 'Cliente Exemplo',
      fabrica: 'Fábrica XYZ',
      itensReclamacao: 'Produto A - Qtd: 1',
      reclamacao: 'Produto não liga',
      observacoesInternas: 'Cliente relatou que o produto parou de funcionar após 2 meses',
      dataCompra: '01/11/2023',
      dataEntrega: '15/11/2023',
      envioFabrica: '10/01/2024',
      agendadoPara: '20/01/2024',
      dataConclusao: '',
      custos: 150.00
    },
    {
      id: 2,
      dataAbertura: '15/01/2024',
      status: 'ENVIADA',
      pedido: 'PED-002',
      oc: 'OC-002',
      vendedor: 'Maria Santos',
      cliente: 'Empresa ABC',
      fabrica: 'Fábrica ABC',
      itensReclamacao: 'Produto B - Qtd: 2',
      reclamacao: 'Produto com defeito na tela',
      observacoesInternas: 'Produto com tela quebrada',
      dataCompra: '10/12/2023',
      dataEntrega: '20/12/2023',
      envioFabrica: '18/01/2024',
      agendadoPara: '25/01/2024',
      dataConclusao: '',
      custos: 200.00
    }
  ]);
  
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'dataAbertura', direcao: 'desc' });

  const handleEdit = (id) => {
    navigate(`/assistencias/editar/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta assistência técnica?')) {
      setAssistencias(assistencias.filter(assistencia => assistencia.id !== id));
    }
  };

  const handleOrdenacao = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const ordenarAssistencias = (lista) => {
    return [...lista].sort((a, b) => {
      let valorA, valorB;
      
      if (ordenacao.campo === 'dataAbertura') {
        // Converter datas para objetos Date para comparação
        valorA = new Date(a.dataAbertura.split('/').reverse().join('-'));
        valorB = new Date(b.dataAbertura.split('/').reverse().join('-'));
      } else {
        valorA = a[ordenacao.campo];
        valorB = b[ordenacao.campo];
      }

      if (ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  };

  const getStatusColor = (statusNome) => {
    const status = statusOptions.find(s => s.nome === statusNome);
    return status ? status.hex : '#9E9E9E';
  };

  const assistenciasFiltradas = assistencias.filter(assistencia => {
    const matchBusca = 
      assistencia.pedido.toLowerCase().includes(termoBusca.toLowerCase()) ||
      assistencia.cliente.toLowerCase().includes(termoBusca.toLowerCase()) ||
      assistencia.oc.toLowerCase().includes(termoBusca.toLowerCase()) ||
      assistencia.vendedor.toLowerCase().includes(termoBusca.toLowerCase()) ||
      assistencia.fabrica.toLowerCase().includes(termoBusca.toLowerCase());
    
    const matchStatus = filtroStatus === '' || assistencia.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  const assistenciasOrdenadas = ordenarAssistencias(assistenciasFiltradas);

  const getIconeOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) {
      return <FaSort className="text-gray-400" />;
    }
    return ordenacao.direcao === 'asc' ? 
      <FaSortUp className="text-blue-600" /> : 
      <FaSortDown className="text-blue-600" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaTools className="text-blue-600" />
          Assistências Técnicas
        </h1>
        <button
          onClick={() => navigate('/assistencias/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Nova Assistência
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por pedido, cliente, OC, vendedor ou fábrica..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>

          {/* Filtro por Status */}
          <div className="relative">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">Todos os Status</option>
              {statusOptions.map((status) => (
                <option key={status.nome} value={status.nome}>
                  {status.nome}
                </option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleOrdenacao('dataAbertura')}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  Data Abertura
                  {getIconeOrdenacao('dataAbertura')}
                </button>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OC</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fábrica</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reclamação</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custos</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assistenciasOrdenadas.map((assistencia) => (
              <tr key={assistencia.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{assistencia.dataAbertura}</td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(assistencia.status) }}
                  >
                    {assistencia.status}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{assistencia.pedido}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{assistencia.oc}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{assistencia.cliente}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{assistencia.vendedor}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{assistencia.fabrica}</td>
                <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate" title={assistencia.reclamacao}>
                  {assistencia.reclamacao}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(assistencia.custos)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(assistencia.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(assistencia.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assistenciasOrdenadas.length === 0 && (
        <div className="text-center py-8">
          <FaTools className="mx-auto text-gray-400 text-4xl mb-4" />
          <p className="text-gray-500">Nenhuma assistência técnica encontrada</p>
        </div>
      )}
    </div>
  );
}

export default ListaAssistencias; 