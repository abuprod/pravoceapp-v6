import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaTimes, FaSearch, FaFilter } from 'react-icons/fa';

function NotificacoesFornecedor() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([
    {
      id: 1,
      titulo: 'Nova tabela de preços',
      fornecedor: 'Fornecedor A',
      data: '2024-01-01',
      status: 'Não lida'
    },
    {
      id: 2,
      titulo: 'Atualização de catálogo',
      fornecedor: 'Fornecedor B',
      data: '2024-01-02',
      status: 'Lida'
    }
  ]);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  const handleMarcarComoLida = (id) => {
    setNotificacoes(notificacoes.map(notificacao =>
      notificacao.id === id ? { ...notificacao, status: 'Lida' } : notificacao
    ));
  };

  const handleExcluir = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      setNotificacoes(notificacoes.filter(notificacao => notificacao.id !== id));
    }
  };

  const notificacoesFiltradas = notificacoes.filter(notificacao => {
    const correspondeBusca = notificacao.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      notificacao.fornecedor.toLowerCase().includes(termoBusca.toLowerCase());
    
    const correspondeFiltro = filtroStatus === 'Todos' || 
      (filtroStatus === 'Lidas' && notificacao.status === 'Lida') ||
      (filtroStatus === 'Não lidas' && notificacao.status === 'Não lida');

    return correspondeBusca && correspondeFiltro;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notificações de Fornecedores</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar notificações..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos</option>
            <option value="Lidas">Lidas</option>
            <option value="Não lidas">Não lidas</option>
          </select>
          <FaFilter className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notificacoesFiltradas.map((notificacao) => (
              <tr key={notificacao.id} className={notificacao.status === 'Não lida' ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{notificacao.titulo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notificacao.fornecedor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notificacao.data}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    notificacao.status === 'Lida' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {notificacao.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {notificacao.status === 'Não lida' && (
                    <button
                      onClick={() => handleMarcarComoLida(notificacao.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button
                    onClick={() => handleExcluir(notificacao.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTimes />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NotificacoesFornecedor; 