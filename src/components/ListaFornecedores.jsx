import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle, FaTable, FaBook, FaBell } from 'react-icons/fa';

function ListaFornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState(null);

  // Função para carregar fornecedores do localStorage
  const carregarFornecedores = () => {
    try {
      const dadosSalvos = localStorage.getItem('fornecedores');
      if (dadosSalvos) {
        const fornecedoresCarregados = JSON.parse(dadosSalvos);
        // Garantir que todos os fornecedores tenham um array de descontos
        const fornecedoresFormatados = fornecedoresCarregados.map(fornecedor => ({
          ...fornecedor,
          descontos: Array.isArray(fornecedor.descontos) ? fornecedor.descontos : []
        }));
        setFornecedores(fornecedoresFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      alert('Erro ao carregar fornecedores. Por favor, recarregue a página.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar fornecedores ao montar o componente
  useEffect(() => {
    carregarFornecedores();
  }, []);

  // Adicionar listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fornecedores') {
        carregarFornecedores();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleEdit = (id) => {
    navigate(`/fornecedores/editar/${id}`);
  };

  const handleDelete = (id) => {
    setFornecedorToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (fornecedorToDelete) {
      try {
        const novosFornecedores = fornecedores.filter(f => f.id !== fornecedorToDelete);
        setFornecedores(novosFornecedores);
        localStorage.setItem('fornecedores', JSON.stringify(novosFornecedores));
        setShowDeleteModal(false);
        setFornecedorToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        alert('Erro ao excluir fornecedor. Por favor, tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFornecedorToDelete(null);
  };

  // Filtrar fornecedores com base no termo de busca
  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nomeFantasia?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    f.razaoSocial?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    f.cnpj?.includes(termoBusca) ||
    f.representante?.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Função para verificar se o fornecedor tem múltiplos conjuntos de tributos
  const temMultiplosTributos = (fornecedor) => {
    return Array.isArray(fornecedor.tributosDescontos) && fornecedor.tributosDescontos.length > 1;
  };

  // Função para obter o primeiro conjunto de tributos (para exibição quando não há múltiplos)
  const getPrimeiroTributo = (fornecedor) => {
    if (!Array.isArray(fornecedor.tributosDescontos) || fornecedor.tributosDescontos.length === 0) {
      return { frete: 0, ipi: 0, descontos: [] };
    }
    return fornecedor.tributosDescontos[0];
  };

  // Função para calcular os descontos de um conjunto de tributos
  const calcularDescontos = (descontos) => {
    if (!Array.isArray(descontos)) return [];
    return descontos.reduce((totais, desconto) => {
      if (typeof desconto.valor === 'string') {
        const valores = desconto.valor.split('+').map(v => {
          const valorNumerico = Number(v.trim().replace(',', '.'));
          return isNaN(valorNumerico) ? 0 : valorNumerico;
        });
        return [...totais, ...valores];
      }
      return totais;
    }, []);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/fornecedores/tabelas')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaTable /> Tabelas
          </button>
          <button
            onClick={() => navigate('/fornecedores/catalogos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaBook /> Catálogos
          </button>
          <button
            onClick={() => navigate('/fornecedores/avisos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaBell /> Avisos
          </button>
          <button
            onClick={() => navigate('/fornecedores/novo')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FaPlus /> Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar fornecedor por nome, razão social, CNPJ ou representante..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabela de fornecedores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome Fantasia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Razão Social
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frete (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IPI (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Desconto (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fornecedoresFiltrados.map((fornecedor) => {
              const descontoTotal = calcularDescontos(fornecedor.descontos);

              return (
                <tr key={fornecedor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fornecedor.nomeFantasia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fornecedor.razaoSocial}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fornecedor.cnpj}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {temMultiplosTributos(fornecedor) ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        Múltiplos
                      </span>
                    ) : (
                      getPrimeiroTributo(fornecedor).frete.toString().replace('.', ',') + '%'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {temMultiplosTributos(fornecedor) ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        Múltiplos
                      </span>
                    ) : (
                      getPrimeiroTributo(fornecedor).ipi.toString().replace('.', ',') + '%'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {temMultiplosTributos(fornecedor) ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        Múltiplos
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {getPrimeiroTributo(fornecedor).descontos.map((desconto, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {desconto.valor.replace('.', ',')}%
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fornecedor.status === 'Ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {fornecedor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => handleEdit(fornecedor.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Editar fornecedor"
                      >
                        <FaEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDelete(fornecedor.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Excluir fornecedor"
                      >
                        <FaTrash className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {fornecedoresFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  {termoBusca ? 'Nenhum fornecedor encontrado para a busca.' : 'Nenhum fornecedor cadastrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este fornecedor? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaFornecedores; 