import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaCalculator, FaShoppingCart, FaTimes } from 'react-icons/fa';

const Orcamentos = () => {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para modal de conversão
  const [modalConversao, setModalConversao] = useState({
    isOpen: false,
    orcamento: null,
    produtosSelecionados: []
  });

  // Carregar dados do localStorage
  useEffect(() => {
    const carregarOrcamentos = () => {
      const dados = JSON.parse(localStorage.getItem('orcamentos') || '[]');
      setOrcamentos(dados);
      setLoading(false);
    };

    carregarOrcamentos();
  }, []);

  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const matchesSearch = orcamento.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const abrirModalConversao = (orcamento) => {
    setModalConversao({
      isOpen: true,
      orcamento: orcamento,
      produtosSelecionados: orcamento.produtos.map((_, index) => index) // Seleciona todos por padrão
    });
  };

  const fecharModalConversao = () => {
    setModalConversao({
      isOpen: false,
      orcamento: null,
      produtosSelecionados: []
    });
  };

  const toggleProdutoSelecionado = (index) => {
    setModalConversao(prev => ({
      ...prev,
      produtosSelecionados: prev.produtosSelecionados.includes(index)
        ? prev.produtosSelecionados.filter(i => i !== index)
        : [...prev.produtosSelecionados, index]
    }));
  };

  const converterEmPedidoVenda = () => {
    const { orcamento, produtosSelecionados } = modalConversao;
    
    if (produtosSelecionados.length === 0) {
      alert('Selecione pelo menos um produto para converter em pedido de venda.');
      return;
    }

    // Filtrar apenas os produtos selecionados
    const produtosParaPedido = orcamento.produtos.filter((_, index) => 
      produtosSelecionados.includes(index)
    );

    // Criar dados do pedido de venda
    const dadosPedido = {
      orcamentoOrigem: orcamento.numeroOrcamento,
      cliente: orcamento.cliente,
      telefone: orcamento.telefone,
      vendedor: orcamento.vendedor,
      produtos: produtosParaPedido,
      formasPagamento: orcamento.formasPagamento?.map(forma => ({
        ...forma,
        valor: forma.valor || ''
      })) || [],
      observacoes: `Convertido do orçamento #${orcamento.numeroOrcamento}`,
      observacoesInternas: orcamento.observacoesInternas,
      dataCriacao: new Date().toISOString().split('T')[0]
    };

    // Salvar dados temporariamente no localStorage para o componente NovoPedidoVenda
    localStorage.setItem('orcamentoParaPedido', JSON.stringify(dadosPedido));
    
    // Navegar para criar novo pedido de venda
    navigate('/pedidos-venda/novo');
    
    fecharModalConversao();
  };

  const calcularValorTotal = (produtos) => {
    if (!produtos || !Array.isArray(produtos)) return 0;
    return produtos.reduce((total, produto) => {
      const precoFinal = produto.precoFinal || produto.precoLista || 0;
      return total + (Number(precoFinal) || 0);
    }, 0);
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
            <FaCalculator className="mr-2 text-blue-600" />
            Orçamentos
          </h1>
          <p className="text-gray-600">Gerencie os orçamentos da empresa</p>
        </div>
        <Link
          to="/orcamentos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Novo Orçamento
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
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validade
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
              {filteredOrcamentos.map((orcamento) => (
                <tr key={orcamento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{orcamento.numeroOrcamento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{orcamento.cliente}</div>
                    <div className="text-sm text-gray-500">{orcamento.telefone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(orcamento.data).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {calcularValorTotal(orcamento.produtos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {orcamento.validade ? new Date(orcamento.validade).toLocaleDateString('pt-BR') : 'Não definida'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{orcamento.vendedor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Link 
                        to={`/orcamentos/visualizar/${orcamento.id}`}
                        className="text-blue-600 hover:text-blue-900" 
                        title="Visualizar"
                      >
                        <FaEye />
                      </Link>
                      <Link 
                        to={`/orcamentos/editar/${orcamento.id}`}
                        className="text-green-600 hover:text-green-900" 
                        title="Editar"
                      >
                        <FaEdit />
                      </Link>
                      <button 
                        className="text-green-600 hover:text-green-900" 
                        title="Converter em Pedido de Venda"
                        onClick={() => abrirModalConversao(orcamento)}
                      >
                        <FaShoppingCart />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900" 
                        title="Excluir"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
                            const novosOrcamentos = orcamentos.filter(o => o.id !== orcamento.id);
                            setOrcamentos(novosOrcamentos);
                            localStorage.setItem('orcamentos', JSON.stringify(novosOrcamentos));
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
        
        {filteredOrcamentos.length === 0 && (
          <div className="text-center py-8">
            <FaCalculator className="mx-auto text-gray-400 text-4xl mb-4" />
            <p className="text-gray-500">Nenhum orçamento encontrado</p>
            <Link
              to="/orcamentos/novo"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Criar Primeiro Orçamento
            </Link>
          </div>
        )}
      </div>

      {/* Modal de Conversão para Pedido de Venda */}
      {modalConversao.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Converter Orçamento em Pedido de Venda
              </h2>
              <button
                onClick={fecharModalConversao}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {modalConversao.orcamento && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Orçamento #{modalConversao.orcamento.numeroOrcamento}
                  </h3>
                  <p className="text-blue-800">
                    <strong>Cliente:</strong> {modalConversao.orcamento.cliente}
                  </p>
                  <p className="text-blue-800">
                    <strong>Vendedor:</strong> {modalConversao.orcamento.vendedor}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Selecione os produtos para o pedido:
                  </h3>
                  <div className="space-y-2">
                    {modalConversao.orcamento.produtos.map((produto, index) => (
                      <div key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`produto-${index}`}
                          checked={modalConversao.produtosSelecionados.includes(index)}
                          onChange={() => toggleProdutoSelecionado(index)}
                          className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`produto-${index}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">
                                {produto.quantidade}x {produto.produto}
                              </p>
                              {produto.observacoes && (
                                <p className="text-sm text-gray-600">
                                  Obs: {produto.observacoes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                R$ {Number(produto.precoFinal || produto.precoLista || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={fecharModalConversao}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={converterEmPedidoVenda}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FaShoppingCart />
                    Converter em Pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orcamentos; 