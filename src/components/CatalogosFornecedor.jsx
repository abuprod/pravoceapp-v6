import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaExclamationTriangle } from 'react-icons/fa';

function CatalogosFornecedor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [catalogos, setCatalogos] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [catalogoToDelete, setCatalogoToDelete] = useState(null);

  const handleEdit = (id) => {
    navigate(`/fornecedores/catalogos/editar/${id}`);
  };

  const handleDelete = (catalogoId) => {
    setCatalogoToDelete(catalogoId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (catalogoToDelete) {
      const novosCatalogos = catalogos.filter(c => c.id !== catalogoToDelete);
      setCatalogos(novosCatalogos);
      localStorage.setItem(`catalogos_fornecedor_${id}`, JSON.stringify(novosCatalogos));
      setShowDeleteModal(false);
      setCatalogoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCatalogoToDelete(null);
  };

  const catalogosFiltrados = catalogos.filter(catalogo =>
    catalogo.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    catalogo.fornecedor.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Catálogos de Fornecedores</h1>
        <button
          onClick={() => navigate('/fornecedores/catalogos/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FaPlus /> Novo Catálogo
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar catálogos..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Publicação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {catalogosFiltrados.map((catalogo) => (
              <tr key={catalogo.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{catalogo.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{catalogo.fornecedor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{catalogo.dataPublicacao}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    catalogo.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {catalogo.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(catalogo.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(catalogo.id)}
                    className="text-red-600 hover:text-red-900 mr-4"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() => {}}
                    className="text-green-600 hover:text-green-900"
                  >
                    <FaFilePdf />
                  </button>
                </td>
              </tr>
            ))}
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
              Tem certeza que deseja excluir este catálogo? Esta ação não poderá ser desfeita.
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

export default CatalogosFornecedor; 