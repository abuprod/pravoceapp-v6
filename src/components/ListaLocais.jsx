import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFilter, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ListaLocais = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: []
  });
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localToDelete, setLocalToDelete] = useState(null);

  const statusOptions = ['Ativo', 'Inativo'];

  const handleFilterChange = (campo, valor) => {
    if (campo === 'status') {
      setFilters(prev => ({
        ...prev,
        status: prev.status.includes(valor) 
          ? prev.status.filter(s => s !== valor)
          : [...prev.status, valor]
      }));
    }
  };

  const aplicarFiltros = () => {
    setShowFilters(false);
  };

  const limparFiltros = () => {
    setFilters({
      status: []
    });
  };

  const filteredLocais = locais.filter(local => {
    const matchesSearch = local.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         local.sigla.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status.length === 0 || filters.status.includes(local.status);
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (id) => {
    navigate(`/locais/novo/${id}`);
  };

  const handleDelete = (id) => {
    setLocalToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (localToDelete) {
      // Buscar locais atuais do localStorage
      const locaisAtuais = JSON.parse(localStorage.getItem('locais') || '[]');
      
      // Filtrar o local a ser excluído
      const novosLocais = locaisAtuais.filter(local => local.id !== localToDelete);
      
      // Atualizar o localStorage
      localStorage.setItem('locais', JSON.stringify(novosLocais));
      
      // Atualizar o estado local
      setLocais(novosLocais);
      
      // Fechar o modal
      setShowDeleteModal(false);
      setLocalToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setLocalToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para carregar locais do localStorage
  const carregarLocais = () => {
    const dadosSalvos = localStorage.getItem('locais');
    if (dadosSalvos) {
      setLocais(JSON.parse(dadosSalvos));
    }
    setLoading(false);
  };

  // Carregar locais ao montar o componente
  useEffect(() => {
    carregarLocais();
  }, []);

  // Adicionar listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'locais') {
        carregarLocais();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Locais</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FaFilter /> Filtros
              </button>
              <button
                onClick={() => navigate('/locais/novo')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaPlus /> Novo Local
              </button>
            </div>
          </div>

          {/* Modal de Confirmação de Exclusão */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <FaExclamationTriangle className="text-red-500 text-xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir este local? Esta ação não poderá ser desfeita.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Filtros */}
          {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Filtros</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Filtro de Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOptions.map(status => (
                        <label key={status} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={() => handleFilterChange('status', status)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={limparFiltros}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={aplicarFiltros}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nome ou sigla do local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sigla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Abertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fechamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocais.map((local) => (
                  <tr key={local.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {local.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {local.sigla}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(local.status)}`}>
                        {local.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(local.dataAbertura).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {local.dataFechamento ? new Date(local.dataFechamento).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {local.vendedores.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(local.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(local.id)}
                          className="text-red-600 hover:text-red-800"
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
        </>
      )}
    </div>
  );
};

export default ListaLocais; 