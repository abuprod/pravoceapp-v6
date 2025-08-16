import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaEllipsisH } from 'react-icons/fa';

function ListaPedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([
    {
      id: 1,
      numero: 'PED-001',
      fornecedor: 'Fornecedor Exemplo',
      data: '01/01/2023',
      status: 'Pendente',
      valor: 1000.00
    }
  ]);
  const [termoBusca, setTermoBusca] = useState('');
  const [menuAcoes, setMenuAcoes] = useState({ aberto: false, pedidoId: null });

  const handleEdit = (id) => {
    navigate(`/pedidos/editar/${id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      setPedidos(pedidos.filter(pedido => pedido.id !== id));
    }
  };

  const pedidosFiltrados = pedidos.filter(pedido =>
    pedido.numero.toLowerCase().includes(termoBusca.toLowerCase()) ||
    pedido.fornecedor.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <button
          onClick={() => navigate('/pedidos/novo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Novo Pedido
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    className="p-1 text-gray-600 hover:text-gray-900"
                    onClick={() => setMenuAcoes(menuAcoes.aberto && menuAcoes.pedidoId === pedido.id ? { aberto: false, pedidoId: null } : { aberto: true, pedidoId: pedido.id })}
                  >
                    <FaEllipsisH />
                  </button>
                  {menuAcoes.aberto && menuAcoes.pedidoId === pedido.id && (
                    <div className="absolute z-10 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => { setMenuAcoes({ aberto: false, pedidoId: null }); handleEdit(pedido.id); }}
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => { setMenuAcoes({ aberto: false, pedidoId: null }); handleDelete(pedido.id); }}
                      >
                        <FaTrash /> Excluir
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.numero}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.fornecedor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.data}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pedido.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 
                    pedido.status === 'Aprovado' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {pedido.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(pedido.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListaPedidos; 