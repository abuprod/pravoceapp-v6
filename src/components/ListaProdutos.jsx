import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaEllipsisV, FaBoxes } from 'react-icons/fa';
import { createPortal } from 'react-dom';

const PRODUTOS_STORAGE_KEY = 'produtos_cadastrados';

const ListaProdutos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAberto, setMenuAberto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [modalLancamento, setModalLancamento] = useState({
    isOpen: false,
    produto: null
  });
  
  // Dados iniciais padrão
  const produtosIniciais = [
    {
      id: 1,
      sku: 'SOF001',
      descricao: 'Sofá 3 Lugares',
      categoria: 'Sofás',
      fornecedor: 'Móveis ABC',
      estoqueDisponivel: 5,
      estoqueFisico: 5,
      tabc: 2500.00
    },
    {
      id: 2,
      sku: 'MES001',
      descricao: 'Mesa de Jantar',
      categoria: 'Mesas',
      fornecedor: 'Móveis XYZ',
      estoqueDisponivel: 3,
      estoqueFisico: 3,
      tabc: 1800.00
    }
  ];

  // Carregar produtos do localStorage ou usar os iniciais
  const [produtos, setProdutos] = useState(() => {
    const produtosSalvos = localStorage.getItem(PRODUTOS_STORAGE_KEY);
    return produtosSalvos ? JSON.parse(produtosSalvos) : produtosIniciais;
  });

  // Salvar produtos no localStorage sempre que houver mudança
  useEffect(() => {
    localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos));
  }, [produtos]);

  const [modalExclusao, setModalExclusao] = useState({
    isOpen: false,
    produtoId: null,
    produtoDescricao: ''
  });

  // Estados para lançamento de estoque
  const [lancamentoData, setLancamentoData] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipo: 'Entrada',
    quantidade: '',
    observacao: '',
    local: 'DP',
    preco: ''
  });

  // Carregar locais
  const [locais, setLocais] = useState([]);
  
  useEffect(() => {
    const carregarLocais = () => {
      const dadosSalvos = localStorage.getItem('locais');
      if (dadosSalvos) {
        const todosLocais = JSON.parse(dadosSalvos);
        const locaisAtivos = todosLocais
          .filter(local => local.status === 'Ativo')
          .map(local => local.sigla);
        
        const locaisOrdenados = locaisAtivos.sort((a, b) => {
          if (a === 'DP') return -1;
          if (b === 'DP') return 1;
          return a.localeCompare(b);
        });
        
        setLocais(locaisOrdenados);
      }
    };

    carregarLocais();
  }, []);

  const filteredProdutos = produtos.filter(produto =>
    produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id) => {
    console.log('handleEdit chamado com id:', id);
    setMenuAberto(null);
    setTimeout(() => {
      navigate(`/produtos/novo/${id}`);
    }, 100);
  };

  const abrirModalExclusao = (id, descricao) => {
    console.log('abrirModalExclusao chamado com id:', id, 'descricao:', descricao);
    setMenuAberto(null);
    setTimeout(() => {
      setModalExclusao({
        isOpen: true,
        produtoId: id,
        produtoDescricao: descricao
      });
    }, 100);
  };

  const fecharModalExclusao = () => {
    setModalExclusao({
      isOpen: false,
      produtoId: null,
      produtoDescricao: ''
    });
  };

  const handleDelete = () => {
    setProdutos(produtos.filter(p => p.id !== modalExclusao.produtoId));
    fecharModalExclusao();
  };

  // Função para abrir modal de lançamento
  const abrirModalLancamento = (produto) => {
    console.log('abrirModalLancamento chamado com produto:', produto);
    setMenuAberto(null);
    setTimeout(() => {
      setModalLancamento({
        isOpen: true,
        produto: produto
      });
      setLancamentoData({
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tipo: 'Entrada',
        quantidade: '',
        observacao: '',
        local: 'DP',
        preco: produto.tabc ? parseFloat(produto.tabc).toFixed(2) : ''
      });
    }, 100);
  };

  // Função para fechar modal de lançamento
  const fecharModalLancamento = () => {
    setModalLancamento({
      isOpen: false,
      produto: null
    });
  };

  // Função para salvar lançamento
  const handleLancamentoSubmit = (e) => {
    e.preventDefault();
    
    if (!lancamentoData.quantidade || !lancamentoData.local) {
      alert('Por favor, preencha quantidade e local');
      return;
    }

    const novoLancamento = {
      id: Date.now(),
      data: lancamentoData.data,
      hora: lancamentoData.hora,
      tipo: lancamentoData.tipo,
      fornecedor: modalLancamento.produto.fornecedor,
      descricao: modalLancamento.produto.descricao,
      quantidade: parseInt(lancamentoData.quantidade),
      observacao: lancamentoData.observacao,
      local: lancamentoData.local,
      preco: lancamentoData.preco ? parseFloat(lancamentoData.preco) : 0,
      produtoId: modalLancamento.produto.id
    };

    // Salvar no histórico de lançamentos
    const historicoExistente = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
    const novoHistorico = [...historicoExistente, novoLancamento];
    localStorage.setItem('historicoLancamentos', JSON.stringify(novoHistorico));

    // Atualizar estoque do produto
    const produtosAtualizados = produtos.map(produto => {
      if (produto.id === modalLancamento.produto.id) {
        const estoqueAtual = produto.estoqueDisponivel || 0;
        const estoqueFisicoAtual = produto.estoqueFisico || 0;
        const quantidadeLancamento = parseInt(lancamentoData.quantidade);
        
        // Calcular novos valores de estoque
        let novoEstoqueDisponivel, novoEstoqueFisico;
        if (lancamentoData.tipo === 'Entrada') {
          novoEstoqueDisponivel = estoqueAtual + quantidadeLancamento;
          novoEstoqueFisico = estoqueFisicoAtual + quantidadeLancamento;
        } else {
          novoEstoqueDisponivel = Math.max(0, estoqueAtual - quantidadeLancamento);
          novoEstoqueFisico = Math.max(0, estoqueFisicoAtual - quantidadeLancamento);
        }
        
        // Obter estrutura de estoque existente ou criar nova
        const estoqueExistente = produto.estoque || {};
        const estoqueLocal = estoqueExistente[lancamentoData.local] || { quantidade: 0, observacao: '' };
        
        // Calcular nova quantidade para o local específico
        const quantidadeLocalAtual = estoqueLocal.quantidade || 0;
        const novaQuantidadeLocal = lancamentoData.tipo === 'Entrada' 
          ? quantidadeLocalAtual + quantidadeLancamento
          : Math.max(0, quantidadeLocalAtual - quantidadeLancamento);
        
        return {
          ...produto,
          estoqueDisponivel: novoEstoqueDisponivel,
          estoqueFisico: novoEstoqueFisico,
          estoque: {
            ...estoqueExistente,
            [lancamentoData.local]: {
              quantidade: novaQuantidadeLocal,
              observacao: estoqueLocal.observacao
            }
          }
        };
      }
      return produto;
    });

    setProdutos(produtosAtualizados);
    fecharModalLancamento();
    alert('Lançamento realizado com sucesso!');
  };

  // Função para alternar menu
  const toggleMenu = (produtoId, event) => {
    console.log('toggleMenu chamado com produtoId:', produtoId);
    event.stopPropagation();
    
    if (menuAberto === produtoId) {
      console.log('Fechando menu para produtoId:', produtoId);
      setMenuAberto(null);
    } else {
      console.log('Abrindo menu para produtoId:', produtoId);
      const rect = event.currentTarget.getBoundingClientRect();
      
      // Altura aproximada do menu (3 botões + padding)
      const menuHeight = 132; // aproximadamente 44px por botão * 3
      const menuWidth = 192; // minWidth definido no menu
      const spacing = 5; // espaçamento entre botão e menu
      
      // Verificar se há espaço abaixo
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Verificar se há espaço à direita
      const spaceRight = window.innerWidth - rect.left;
      const spaceLeft = rect.left;
      
      // Calcular posição Y
      let y;
      if (spaceBelow >= menuHeight + spacing) {
        // Tem espaço abaixo, posicionar abaixo
        y = rect.bottom + spacing;
      } else if (spaceAbove >= menuHeight + spacing) {
        // Não tem espaço abaixo, mas tem acima, posicionar acima
        y = rect.top - menuHeight - spacing;
      } else {
        // Não tem espaço suficiente nem acima nem abaixo, 
        // posicionar abaixo mesmo e deixar o scrollbar lidar
        y = rect.bottom + spacing;
      }
      
      // Calcular posição X (ajustar se necessário para não sair da tela)
      let x = rect.left;
      if (spaceRight < menuWidth && spaceLeft >= menuWidth) {
        // Alinhar à direita do botão se não há espaço à direita
        x = rect.right - menuWidth;
      } else if (x + menuWidth > window.innerWidth) {
        // Garantir que não ultrapasse a largura da tela
        x = window.innerWidth - menuWidth - 10; // 10px de margem
      }
      
      setMenuPosition({
        x: Math.max(10, x), // Mínimo 10px da borda esquerda
        y: Math.max(10, y)  // Mínimo 10px da borda superior
      });
      setMenuAberto(produtoId);
    }
  };

  // Função para adicionar novo produto
  const handleNovoProduto = (novoProduto) => {
    const novoId = Math.max(...produtos.map(p => p.id), 0) + 1;
    setProdutos([...produtos, { ...novoProduto, id: novoId }]);
  };

  // Encontrar o produto atual do menu
  const produtoAtual = produtos.find(p => p.id === menuAberto);
  
  console.log('menuAberto:', menuAberto);
  console.log('produtoAtual:', produtoAtual);
  console.log('produtos:', produtos);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Produtos</h1>
        <button
          onClick={() => navigate('/produtos/novo')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Novo Produto
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por SKU, descrição ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingBottom: '150px' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Est. Disp.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Est. Fís.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">TABC</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {filteredProdutos.map((produto) => (
              <tr key={produto.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm relative">
                  <div className="menu-dropdown">
                    <button
                      onClick={(e) => toggleMenu(produto.id, e)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      title="Opções"
                    >
                      <FaEllipsisV />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{produto.sku}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleEdit(produto.id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline break-words max-w-xs text-left"
                    title="Clique para editar este produto"
                  >
                    {produto.descricao}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="break-words max-w-[200px]">{produto.fornecedor}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{produto.categoria}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{produto.estoqueDisponivel}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{produto.estoqueFisico}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(produto.tabc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Menu Dropdown Global */}
      {menuAberto && produtoAtual && createPortal(
        <div 
          className="fixed z-[9999] bg-white rounded-md shadow-lg border border-gray-200 menu-actions"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            minWidth: '192px'
          }}
        >
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(produtoAtual.id);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaEdit className="mr-3 text-blue-600" />
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                abrirModalLancamento(produtoAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaBoxes className="mr-3 text-green-600" />
              Fazer Lançamento
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                abrirModalExclusao(produtoAtual.id, produtoAtual.descricao);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaTrash className="mr-3 text-red-600" />
              Excluir
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalExclusao.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
              <button
                onClick={fecharModalExclusao}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o produto "{modalExclusao.produtoDescricao}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={fecharModalExclusao}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lançamento de Estoque */}
      {modalLancamento.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lançamento de Estoque</h3>
              <button
                onClick={fecharModalLancamento}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Produto:</p>
              <p className="font-medium">{modalLancamento.produto?.descricao}</p>
              <p className="text-sm text-gray-500">SKU: {modalLancamento.produto?.sku}</p>
            </div>

            <form onSubmit={handleLancamentoSubmit}>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={lancamentoData.data}
                    onChange={(e) => setLancamentoData({...lancamentoData, data: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={lancamentoData.hora}
                    onChange={(e) => setLancamentoData({...lancamentoData, hora: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={lancamentoData.tipo}
                    onChange={(e) => setLancamentoData({...lancamentoData, tipo: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="Entrada">Entrada</option>
                    <option value="Saída">Saída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                  <select
                    value={lancamentoData.local}
                    onChange={(e) => setLancamentoData({...lancamentoData, local: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    {locais.map(local => (
                      <option key={local} value={local}>{local}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={lancamentoData.quantidade}
                    onChange={(e) => setLancamentoData({...lancamentoData, quantidade: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lancamentoData.preco}
                    onChange={(e) => setLancamentoData({...lancamentoData, preco: e.target.value})}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  value={lancamentoData.observacao}
                  onChange={(e) => setLancamentoData({...lancamentoData, observacao: e.target.value})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="2"
                  placeholder="Observações sobre o lançamento..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fecharModalLancamento}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaProdutos; 