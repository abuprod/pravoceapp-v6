import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import { colaboradoresService } from '../services/database';

function ListaColaboradores() {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [colaboradorToDelete, setColaboradorToDelete] = useState(null);

  // Carregar colaboradores usando o serviço
  const carregarColaboradores = async () => {
    setLoading(true);
    try {
      const dados = await colaboradoresService.buscarTodos();
      setColaboradores(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      setColaboradores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarColaboradores();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'pravoceapp_colaboradores') {
        carregarColaboradores();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleEdit = (id) => {
    navigate(`/colaboradores/editar/${id}`);
  };

  const handleDelete = (id) => {
    setColaboradorToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (colaboradorToDelete) {
      try {
        await colaboradoresService.deletar(colaboradorToDelete);
        await carregarColaboradores();
        setShowDeleteModal(false);
        setColaboradorToDelete(null);
      } catch (error) {
        console.error('Erro ao deletar colaborador:', error);
        alert('Erro ao deletar colaborador. Tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setColaboradorToDelete(null);
  };

  const colaboradoresFiltrados = colaboradores.filter(c =>
    c.nome?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    c.email?.toLowerCase().includes(termoBusca.toLowerCase()) ||
    c.cargo?.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Colaboradores</h1>
        <button
          onClick={() => navigate('/colaboradores/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Novo Colaborador
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Celular</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Entrada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {colaboradoresFiltrados.map((colaborador) => (
              <tr key={colaborador.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{colaborador.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{colaborador.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{colaborador.celular}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{colaborador.cargo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{colaborador.dataEntrada}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    colaborador.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {colaborador.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(colaborador.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(colaborador.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {colaboradoresFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {termoBusca ? 'Nenhum colaborador encontrado para a busca.' : 'Nenhum colaborador cadastrado.'}
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
              Tem certeza que deseja excluir este colaborador? Esta ação não poderá ser desfeita.
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

export default ListaColaboradores; 