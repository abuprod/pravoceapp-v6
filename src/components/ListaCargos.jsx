import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEllipsisV, FaExclamationTriangle } from 'react-icons/fa';
import { cargosService } from '../services/database';

function ListaCargos() {
  const navigate = useNavigate();
  const [cargos, setCargos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cargoToDelete, setCargoToDelete] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // Carregar cargos usando o serviço
  const carregarCargos = async () => {
    setLoading(true);
    try {
      const dados = await cargosService.buscarTodos();
      setCargos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      setCargos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarCargos();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'pravoceapp_cargos') {
        carregarCargos();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleEdit = (id) => {
    setActiveMenu(null);
    navigate(`/cargos/editar/${id}`);
  };

  const handleDelete = (id) => {
    setActiveMenu(null);
    setCargoToDelete(id);
    setShowDeleteModal(true);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const confirmDelete = async () => {
    if (cargoToDelete) {
      try {
        await cargosService.deletar(cargoToDelete);
        await carregarCargos();
        setShowDeleteModal(false);
        setCargoToDelete(null);
      } catch (error) {
        console.error('Erro ao deletar cargo:', error);
        alert('Erro ao deletar cargo. Tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCargoToDelete(null);
  };

  const cargosFiltrados = cargos.filter(cargo =>
    cargo.nome?.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cargos</h1>
        <button
          onClick={() => navigate('/cargos/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Novo Cargo
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cargo..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {cargosFiltrados.map((cargo) => (
            <div key={cargo.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{cargo.nome}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cargo.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cargo.status}
                  </span>
                  {cargo.descricao && (
                    <span className="text-sm text-gray-500">{cargo.descricao}</span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={(e) => toggleMenu(e, cargo.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaEllipsisV />
                </button>
                
                {activeMenu === cargo.id && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => handleEdit(cargo.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cargo.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {cargosFiltrados.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {termoBusca ? 'Nenhum cargo encontrado para a busca.' : 'Nenhum cargo cadastrado.'}
            </div>
          )}
        </div>
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
              Tem certeza que deseja excluir este cargo? Esta ação não poderá ser desfeita.
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

export default ListaCargos; 