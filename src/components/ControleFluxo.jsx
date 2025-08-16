import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaDownload, FaEye, FaEdit, FaTrash, FaUser, FaPhone, FaCalendarAlt, FaClock, FaShoppingCart } from 'react-icons/fa';

const ControleFluxo = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados do localStorage
  useEffect(() => {
    const carregarRegistros = () => {
      const dados = JSON.parse(localStorage.getItem('controleFluxo') || '[]');
      setRegistros(dados);
      setLoading(false);
    };

    carregarRegistros();
  }, []);

  const filteredRegistros = registros.filter(registro => {
    const matchesSearch = registro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registro.telefone.includes(searchTerm);
    return matchesSearch;
  });

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarHora = (hora) => {
    return hora || 'Não informada';
  };

  const formatarProdutos = (produtos) => {
    if (!produtos || !Array.isArray(produtos)) return '-';
    return produtos.map(p => `${p.produto} (${p.quantidade})`).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Controle de Fluxo de Clientes
          </h1>
          <p className="text-gray-600">Acompanhe o fluxo de clientes e motivos de não compra</p>
        </div>
        <Link
          to="/controle-fluxo/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Novo Registro
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Registros */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produtos/Qtd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistros.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatarData(registro.data)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatarHora(registro.hora)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{registro.nome}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <FaPhone className="mr-1 text-xs" />
                      {registro.telefone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {formatarProdutos(registro.produtos)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registro.vendedor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link 
                        to={`/controle-fluxo/visualizar/${registro.id}`}
                        className="text-blue-600 hover:text-blue-900" 
                        title="Visualizar"
                      >
                        <FaEye />
                      </Link>
                      <Link 
                        to={`/controle-fluxo/editar/${registro.id}`}
                        className="text-green-600 hover:text-green-900" 
                        title="Editar"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="text-red-600 hover:text-red-900" 
                        title="Excluir"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                            const novosRegistros = registros.filter(r => r.id !== registro.id);
                            setRegistros(novosRegistros);
                            localStorage.setItem('controleFluxo', JSON.stringify(novosRegistros));
                          }
                        }}
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
        
        {filteredRegistros.length === 0 && (
          <div className="text-center py-8">
            <FaUser className="mx-auto text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500">Nenhum registro encontrado</p>
            <Link
              to="/controle-fluxo/novo"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Criar Primeiro Registro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControleFluxo; 