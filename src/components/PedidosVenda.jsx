import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaFilter, FaEllipsisV, FaEdit, FaTrash, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown, FaExclamationTriangle } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { createPortal } from 'react-dom';
import { pedidosVendaService } from '../services/database';

const colunasPadrao = [
  { id: 'situacao', label: 'Status' },
  { id: 'numeroPedido', label: 'Pedido' },
  { id: 'ocVinculada', label: 'OC' },
  { id: 'dataCriacao', label: 'Data' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'sl', label: 'SL' },
  { id: 'valor', label: 'Valor' },
];

const PedidosVenda = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colunas, setColunas] = useState(colunasPadrao);
  const [showFilters, setShowFilters] = useState(false);
  const [menuAberto, setMenuAberto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    status: [],
    statusInput: '',
    dataInicio: '',
    dataFim: '',
    cliente: '',
    vendedor: '',
    valorMin: '',
    valorMax: ''
  });
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [ordensCompraMap, setOrdensCompraMap] = useState({}); // Mapeia numeroPedido -> { numeroOC, id }

  // Carregar pedidos do Firestore
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        setLoading(true);
        const pedidosData = await pedidosVendaService.buscarTodos();
        console.log('Pedidos carregados:', pedidosData);
        setPedidos(pedidosData);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, []);

  // Carregar mapeamento de ordens de compra (numeroPedido -> { numeroOC, id })
  useEffect(() => {
    const carregarOrdensCompra = () => {
      try {
        const ordensSalvas = localStorage.getItem('ordensCompra');
        if (ordensSalvas) {
          const ordens = JSON.parse(ordensSalvas);
          const mapa = {};
          ordens.forEach(ordem => {
            if (ordem.pedidoVinculado && (ordem.numero || ordem.oc)) {
              mapa[ordem.pedidoVinculado] = {
                numeroOC: ordem.numero || ordem.oc,
                id: ordem.id
              };
            }
          });
          setOrdensCompraMap(mapa);
        }
      } catch (error) {
        console.error('Erro ao carregar ordens de compra:', error);
      }
    };

    carregarOrdensCompra();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'ordensCompra') {
        carregarOrdensCompra();
      }
    };

    const handleCustomStorageChange = () => {
      carregarOrdensCompra();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordensCompraChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordensCompraChanged', handleCustomStorageChange);
    };
  }, []);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAberto && !event.target.closest('.menu-actions')) {
        setMenuAberto(null);
      }
      if (showBulkActionsMenu && !event.target.closest('.bulk-actions-menu')) {
        setShowBulkActionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuAberto, showBulkActionsMenu]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ml-1 text-blue-500" /> : 
      <FaSortDown className="ml-1 text-blue-500" />;
  };

  const handleFilterChange = (campo, valor) => {
    if (campo === 'status') {
      setFilters(prev => ({
        ...prev,
        status: prev.status.includes(valor) 
          ? prev.status.filter(s => s !== valor)
          : [...prev.status, valor]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  const aplicarFiltros = () => {
    setShowFilters(false);
  };

  const limparFiltros = () => {
    setFilters({
      status: [],
      statusInput: '',
      dataInicio: '',
      dataFim: '',
      cliente: '',
      vendedor: '',
      valorMin: '',
      valorMax: ''
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const novasColunas = Array.from(colunas);
    const [removida] = novasColunas.splice(result.source.index, 1);
    novasColunas.splice(result.destination.index, 0, removida);
    setColunas(novasColunas);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    const dataObj = data.toDate ? data.toDate() : new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    console.log('Formatando valor:', valor, 'Tipo:', typeof valor);
    if (!valor && valor !== 0) return '-';
    
    // Converter para número se for string
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : Number(valor);
    
    if (isNaN(valorNumerico) || valorNumerico === 0) {
      console.log('Valor inválido ou zero:', valor);
      return '-';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
  };

  const obterSiglasLocais = (pedido) => {
    try {
      const siglas = Array.from(
        new Set(
          (pedido?.produtos || [])
            .map((p) => (p && p.sl ? String(p.sl).trim() : ''))
            .filter((sl) => sl)
        )
      );
      return siglas.length > 0 ? siglas.join(', ') : '-';
    } catch (e) {
      return '-';
    }
  };

  const toggleMenu = (pedidoId, event) => {
    event.stopPropagation();
    
    if (menuAberto === pedidoId) {
      setMenuAberto(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: rect.left,
        y: rect.bottom + 5
      });
      setMenuAberto(pedidoId);
    }
  };

  const handleEdit = (id) => {
    setMenuAberto(null);
    setTimeout(() => {
      navigate(`/pedidos-venda/editar/${id}`);
    }, 100);
  };

  const handleDelete = async (id) => {
    setMenuAberto(null);
    if (window.confirm('Tem certeza que deseja excluir este pedido? O estoque será revertido automaticamente.')) {
      try {
        // Buscar o pedido antes de excluir para reverter o estoque
        const pedidoParaExcluir = pedidos.find(p => p.id === id);
        
        if (pedidoParaExcluir) {
          // Reverter estoque antes de excluir o pedido
          const reversaoRealizada = await reverterEstoque(pedidoParaExcluir);
          
          if (reversaoRealizada) {
            console.log('✅ Estoque revertido com sucesso para o pedido:', pedidoParaExcluir.numeroPedido);
          } else {
            console.warn('⚠️ Erro ao reverter estoque, mas o pedido será excluído');
          }
        }
        
        // Excluir o pedido
        await pedidosVendaService.deletar(id);
        setPedidos(pedidos.filter(pedido => pedido.id !== id));
        
        alert('✅ Pedido excluído com sucesso! O estoque foi revertido automaticamente.');
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        alert('Erro ao excluir pedido. Tente novamente.');
      }
    }
  };

  // Função para reverter estoque quando pedido for excluído
  const reverterEstoque = async (pedido) => {
    try {
      // Carregar produtos cadastrados atualizados
      const produtosCadastrados = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
      const produtosAtualizados = [...produtosCadastrados];
      
      // Array para armazenar as reversões realizadas
      const reversoesRealizadas = [];
      
      // Processar cada produto do pedido
      for (const produtoPedido of pedido.produtos || []) {
        // Pular produtos "SE" (sob encomenda)
        if (produtoPedido.sl === 'SE') {
          continue;
        }
        
        // Encontrar o produto cadastrado correspondente
        const produtoCadastrado = produtosAtualizados.find(p => p.id === produtoPedido.produtoId);
        
        if (produtoCadastrado && produtoPedido.sl) {
          const quantidadeVendida = parseInt(produtoPedido.quantidade) || 0;
          const estoqueAtual = produtoCadastrado.estoque?.[produtoPedido.sl]?.quantidade || 0;
          
          // Calcular nova quantidade (reverter a baixa)
          const novaQuantidade = estoqueAtual + quantidadeVendida;
          
          // Atualizar estoque do produto
          if (!produtoCadastrado.estoque) {
            produtoCadastrado.estoque = {};
          }
          
          produtoCadastrado.estoque[produtoPedido.sl] = {
            quantidade: novaQuantidade,
            observacao: produtoCadastrado.estoque[produtoPedido.sl]?.observacao || ''
          };
          
          // Calcular estoque total disponível
          const estoqueTotal = Object.values(produtoCadastrado.estoque).reduce((total, local) => {
            return total + (local.quantidade || 0);
          }, 0);
          
          // Atualizar campos de estoque total
          produtoCadastrado.estoqueDisponivel = estoqueTotal;
          produtoCadastrado.estoqueFisico = estoqueTotal;
          
          // Registrar a reversão realizada
          reversoesRealizadas.push({
            produto: produtoPedido.produto,
            local: produtoPedido.sl,
            quantidadeReversao: quantidadeVendida,
            estoqueAnterior: estoqueAtual,
            estoqueAtual: novaQuantidade
          });
          
          console.log(`✅ Reversão realizada: ${produtoPedido.produto} - ${quantidadeVendida} unidades devolvidas para ${produtoPedido.sl}`);
        }
      }
      
      // Salvar produtos atualizados no localStorage
      localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
      
      // Criar lançamento no histórico de estoque
      const historicoExistente = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
      const obterDataHoraLocal = () => {
        const agora = new Date();
        const yyyy = String(agora.getFullYear());
        const mm = String(agora.getMonth() + 1).padStart(2, '0');
        const dd = String(agora.getDate()).padStart(2, '0');
        const data = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD local
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { data, hora };
      };
      const { data: dataAtual, hora: horaAtual } = obterDataHoraLocal();
      
      // Criar lançamentos de entrada para cada produto (reversão)
      const novosLancamentos = reversoesRealizadas.map((reversao, index) => ({
        id: Date.now() + Math.random() + index,
        data: dataAtual,
        hora: horaAtual,
        tipo: 'Entrada',
        fornecedor: 'Venda',
        descricao: reversao.produto,
        quantidade: reversao.quantidadeReversao,
        observacao: `Reversão - Pedido ${pedido.numeroPedido} excluído`,
        usuario: 'Sistema',
        local: reversao.local
      }));
      
      // Adicionar novos lançamentos ao histórico
      const novoHistorico = [...historicoExistente, ...novosLancamentos];
      localStorage.setItem('historicoLancamentos', JSON.stringify(novoHistorico));
      
      console.log('✅ Reversão no estoque realizada com sucesso:', reversoesRealizadas);
      
      // Mostrar resumo das reversões
      if (reversoesRealizadas.length > 0) {
        const resumo = reversoesRealizadas.map(r => 
          `• ${r.produto} (${r.local}): ${r.quantidadeReversao} unidades devolvidas`
        ).join('\n');
        
        console.log(`✅ Reversão no estoque realizada com sucesso!\n\nProdutos processados:\n${resumo}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao reverter estoque:', error);
      return false;
    }
  };

  // Função para buscar produtos dentro do pedido
  const buscarProdutosPedido = (pedido, termoBusca) => {
    if (!pedido.produtos || !Array.isArray(pedido.produtos)) return false;
    
    return pedido.produtos.some(produto => {
      const nomeProduto = (produto.produto || '').toLowerCase();
      const codigoProduto = (produto.codigo || '').toLowerCase();
      return nomeProduto.includes(termoBusca.toLowerCase()) || 
             codigoProduto.includes(termoBusca.toLowerCase());
    });
  };

  // Funções de seleção múltipla
  const toggleItemSelecionado = (pedidoId) => {
    setItensSelecionados(prev => {
      if (prev.includes(pedidoId)) {
        return prev.filter(id => id !== pedidoId);
      } else {
        return [...prev, pedidoId];
      }
    });
  };

  const toggleTodosSelecionados = () => {
    if (itensSelecionados.length === filteredAndSortedPedidos.length) {
      setItensSelecionados([]);
    } else {
      setItensSelecionados(filteredAndSortedPedidos.map(pedido => pedido.id));
    }
  };

  // Função para excluir múltiplos itens
  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      // Reverter estoque para cada pedido selecionado
      for (const pedidoId of itensSelecionados) {
        const pedidoParaExcluir = pedidos.find(p => p.id === pedidoId);
        if (pedidoParaExcluir) {
          await reverterEstoque(pedidoParaExcluir);
        }
      }

      // Excluir pedidos do Firestore
      for (const pedidoId of itensSelecionados) {
        await pedidosVendaService.deletar(pedidoId);
      }
      
      // Atualizar estado local
      const novosPedidos = pedidos.filter(pedido => !itensSelecionados.includes(pedido.id));
      setPedidos(novosPedidos);
      
      // Limpar seleção
      setItensSelecionados([]);
      setShowBulkDeleteModal(false);
      
      alert(`✅ ${itensSelecionados.length} pedido(s) excluído(s) com sucesso! O estoque foi revertido automaticamente.`);
    } catch (error) {
      console.error('Erro ao excluir pedidos:', error);
      alert('Erro ao excluir pedidos. Tente novamente.');
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  // Função para imprimir pedidos selecionados
  const handleBulkPrint = () => {
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para imprimir.');
      return;
    }

    // Buscar os pedidos completos
    const pedidosSelecionados = pedidos.filter(pedido => itensSelecionados.includes(pedido.id));

    // Gerar HTML para impressão
    gerarImpressao(pedidosSelecionados);
    setShowBulkActionsMenu(false);
  };

  // Função para gerar impressão
  const gerarImpressao = (pedidosParaImprimir) => {
    const htmlImpressao = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedidos de Venda</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 20pt;
            color: #2563eb;
          }
          .pedido {
            page-break-inside: avoid;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .pedido-header {
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .pedido-numero {
            font-size: 16pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item {
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
            background-color: #e0e7ff;
            color: #3730a3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f3f4f6;
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-size: 10pt;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 10pt;
          }
          .total {
            text-align: right;
            font-weight: bold;
            font-size: 12pt;
            margin-top: 10px;
            color: #2563eb;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .pedido { page-break-after: always; }
            .pedido:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛒 PEDIDOS DE VENDA</h1>
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        ${pedidosParaImprimir.map(pedido => `
          <div class="pedido">
            <div class="pedido-header">
              <div class="pedido-numero">Pedido Nº ${pedido.numeroPedido || 'S/N'}</div>
              <span class="status">${pedido.situacao?.toUpperCase() || 'PENDENTE'}</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Data:</span>
                <span class="info-value">${formatarData(pedido.dataCriacao)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${pedido.cliente || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">CPF/CNPJ:</span>
                <span class="info-value">${pedido.cpfCnpj || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${pedido.vendedor || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Local(is):</span>
                <span class="info-value">${obterSiglasLocais(pedido)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">OC Vinculada:</span>
                <span class="info-value">${pedido.ocVinculada || '-'}</span>
              </div>
            </div>

            ${pedido.produtos && pedido.produtos.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 35%;">Produto</th>
                    <th style="width: 10%;">Local</th>
                    <th style="width: 10%;">Qtd</th>
                    <th style="width: 15%;">Vlr. Unit.</th>
                    <th style="width: 15%;">Vlr. Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${pedido.produtos.map(produto => `
                    <tr>
                      <td>${produto.codigo || '-'}</td>
                      <td>${produto.produto || produto.descricao || '-'}</td>
                      <td>${produto.sl || '-'}</td>
                      <td>${produto.quantidade || 1}</td>
                      <td>R$ ${(parseFloat(produto.valorUnitario) || 0).toFixed(2)}</td>
                      <td>R$ ${(parseFloat(produto.valorTotal) || (parseFloat(produto.quantidade) * parseFloat(produto.valorUnitario)) || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">Total do Pedido: ${formatarValor(pedido.valor)}</div>
            ` : `
              <p style="color: #666; font-style: italic;">Nenhum produto cadastrado neste pedido.</p>
            `}

            ${pedido.observacoes ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #f9fafb; border-left: 3px solid #2563eb;">
                <strong>Observações:</strong>
                <p style="margin: 5px 0 0 0;">${pedido.observacoes}</p>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Abrir janela de impressão
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(htmlImpressao);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    
    // Aguardar um momento e então imprimir
    setTimeout(() => {
      janelaImpressao.print();
    }, 500);
  };

  // Filtrar e ordenar pedidos
  const filteredAndSortedPedidos = pedidos
    .filter(pedido => {
      const matchesSearch = 
        (pedido.numeroPedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.cpfCnpj || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.vendedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.situacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.ocVinculada || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        buscarProdutosPedido(pedido, searchTerm);
      
      const matchesStatus = filters.status.length === 0 || 
        filters.status.includes(pedido.situacao);
      
      const matchesCliente = !filters.cliente || 
        (pedido.cliente || '').toLowerCase().includes(filters.cliente.toLowerCase());
      
      const matchesVendedor = !filters.vendedor || 
        (pedido.vendedor || '').toLowerCase().includes(filters.vendedor.toLowerCase());
      
      const matchesData = (!filters.dataInicio || new Date(pedido.dataCriacao?.toDate ? pedido.dataCriacao.toDate() : pedido.dataCriacao) >= new Date(filters.dataInicio)) &&
        (!filters.dataFim || new Date(pedido.dataCriacao?.toDate ? pedido.dataCriacao.toDate() : pedido.dataCriacao) <= new Date(filters.dataFim));

      const valorPedido = typeof pedido.valor === 'string' ? parseFloat(pedido.valor.replace(',', '.')) : Number(pedido.valor) || 0;
      const matchesValor = (!filters.valorMin || valorPedido >= parseFloat(filters.valorMin)) &&
        (!filters.valorMax || valorPedido <= parseFloat(filters.valorMax));

      return matchesSearch && matchesStatus && matchesCliente && matchesVendedor && matchesData && matchesValor;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'dataCriacao') {
        aValue = aValue?.toDate ? aValue.toDate() : new Date(aValue);
        bValue = bValue?.toDate ? bValue.toDate() : new Date(bValue);
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      if (sortField === 'valor') {
        aValue = typeof aValue === 'string' ? parseFloat(aValue.replace(',', '.')) : Number(aValue) || 0;
        bValue = typeof bValue === 'string' ? parseFloat(bValue.replace(',', '.')) : Number(bValue) || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return sortDirection === 'asc'
        ? String(aValue || '').localeCompare(String(bValue || ''))
        : String(bValue || '').localeCompare(String(aValue || ''));
    });

  // Encontrar o pedido atual do menu
  const pedidoAtual = pedidos.find(p => p.id === menuAberto);

  return (
    <div className="w-full px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos de Venda</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FaFilter /> Filtros
          </button>
          <Link
            to="/pedidos-venda/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            Novo Pedido
          </Link>
          
          {/* Botão de menu de ações em lote */}
          <div className="relative bulk-actions-menu">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBulkActionsMenu(!showBulkActionsMenu);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              title="Ações em Lote"
            >
              <FaEllipsisV />
            </button>
            
            {showBulkActionsMenu && (
              <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 bulk-actions-menu whitespace-nowrap">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleBulkDelete();
                      setShowBulkActionsMenu(false);
                    }}
                    disabled={itensSelecionados.length === 0}
                    className={`flex items-center w-full px-4 py-2 text-sm whitespace-nowrap ${
                      itensSelecionados.length === 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaTrash className="mr-2 text-red-600 flex-shrink-0" />
                    <span>Excluir Selecionados ({itensSelecionados.length})</span>
                  </button>
                  <button
                    onClick={handleBulkPrint}
                    disabled={itensSelecionados.length === 0}
                    className={`flex items-center w-full px-4 py-2 text-sm whitespace-nowrap ${
                      itensSelecionados.length === 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Imprimir Selecionados ({itensSelecionados.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar pedidos (cliente, CPF, número, produtos, status, OC...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
                <div className="relative">
                  <input
                    type="text"
                    value={filters.statusInput || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters(prev => ({
                        ...prev,
                        statusInput: value
                      }));
                    }}
                    onBlur={() => {
                      if (filters.statusInput.trim()) {
                        const newStatus = filters.statusInput.trim();
                        if (!filters.status.includes(newStatus)) {
                          setFilters(prev => ({
                            ...prev,
                            status: [...prev.status, newStatus],
                            statusInput: ''
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            statusInput: ''
                          }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filters.statusInput.trim()) {
                        e.preventDefault();
                        const newStatus = filters.statusInput.trim();
                        if (!filters.status.includes(newStatus)) {
                          setFilters(prev => ({
                            ...prev,
                            status: [...prev.status, newStatus],
                            statusInput: ''
                          }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o status..."
                  />
                </div>
                {filters.status.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filters.status.map((status, index) => (
                      <span
                        key={`${status}-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {status}
                        <button
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              status: prev.status.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtro de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input
                  type="text"
                  value={filters.cliente}
                  onChange={(e) => handleFilterChange('cliente', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por cliente"
                />
              </div>

              {/* Filtro de Vendedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
                <input
                  type="text"
                  value={filters.vendedor}
                  onChange={(e) => handleFilterChange('vendedor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por vendedor"
                />
              </div>

              {/* Filtro de Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filtro de Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    value={filters.valorMin}
                    onChange={(e) => handleFilterChange('valorMin', e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
                  <input
                    type="number"
                    value={filters.valorMax}
                    onChange={(e) => handleFilterChange('valorMax', e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

      <div className="bg-white rounded-lg shadow-md w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="colunas" direction="horizontal">
                {(provided) => (
                  <tr ref={provided.innerRef} {...provided.droppableProps}>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={itensSelecionados.length === filteredAndSortedPedidos.length && filteredAndSortedPedidos.length > 0}
                        onChange={toggleTodosSelecionados}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        title="Selecionar todos"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                    {colunas.map((col, idx) => (
                      <Draggable key={col.id} draggableId={col.id} index={idx}>
                        {(provided, snapshot) => (
                          <th
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer ${snapshot.isDragging ? 'bg-blue-100' : ''}`}
                            onClick={() => handleSort(col.id)}
                          >
                            <div className="flex items-center">
                              {col.label}
                              {getSortIcon(col.id)}
                            </div>
                          </th>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tr>
                )}
              </Droppable>
            </DragDropContext>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={colunas.length + 2} className="w-full text-center p-8 text-gray-500">
                  <p className="text-lg">Carregando pedidos...</p>
                </td>
              </tr>
            ) : filteredAndSortedPedidos.length === 0 ? (
              <tr>
                <td colSpan={colunas.length + 2} className="w-full text-center p-8 text-gray-500">
                  <p className="text-lg">
                    {pedidos.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido corresponde aos filtros aplicados'}
                  </p>
                  <p className="text-sm mt-2">
                    {pedidos.length === 0 ? 'Clique em "Novo Pedido" para começar' : 'Tente ajustar os filtros ou termos de busca'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredAndSortedPedidos.map((pedido, idx) => (
                <tr key={pedido.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <input
                      type="checkbox"
                      checked={itensSelecionados.includes(pedido.id)}
                      onChange={() => toggleItemSelecionado(pedido.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm relative">
                    <div className="menu-dropdown">
                      <button
                        onClick={(e) => toggleMenu(pedido.id, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        title="Opções"
                      >
                        <FaEllipsisV />
                      </button>
                    </div>
                  </td>
                  {colunas.map((col) => (
                    <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {col.id === 'dataCriacao'
                        ? formatarData(pedido[col.id])
                        : col.id === 'valor'
                        ? (() => {
                            console.log('Pedido completo:', pedido);
                            console.log('Valor do pedido:', pedido[col.id], 'Tipo:', typeof pedido[col.id]);
                            const valorFormatado = formatarValor(pedido[col.id]);
                            console.log('Valor formatado:', valorFormatado);
                            return valorFormatado;
                          })()
                        : col.id === 'sl'
                        ? obterSiglasLocais(pedido)
                        : col.id === 'numeroPedido'
                        ? (
                            <button
                              onClick={() => handleEdit(pedido.id)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              title="Clique para editar este pedido"
                            >
                              {pedido[col.id] || '-'}
                            </button>
                          )
                        : col.id === 'ocVinculada'
                        ? (() => {
                            const ocInfo = ordensCompraMap[pedido.numeroPedido];
                            const numeroOC = ocInfo?.numeroOC || pedido.ocVinculada;
                            if (!numeroOC) return '-';
                            
                            const ocId = ocInfo?.id;
                            if (ocId) {
                              return (
                                <Link
                                  to={`/ordens-compra/editar/${ocId}`}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Clique para editar esta ordem de compra"
                                >
                                  {numeroOC}
                                </Link>
                              );
                            }
                            return numeroOC;
                          })()
                        : pedido[col.id] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Menu Dropdown Global */}
      {menuAberto && pedidoAtual && createPortal(
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
                handleEdit(pedidoAtual.id);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaEdit className="mr-3 text-blue-600" />
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(pedidoAtual.id);
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

      {/* Modal de Confirmação de Exclusão em Lote */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão em Lote
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Você está prestes a excluir <strong>{itensSelecionados.length}</strong> {itensSelecionados.length === 1 ? 'pedido selecionado' : 'pedidos selecionados'}.
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Esta ação não poderá ser desfeita. Todos os pedidos selecionados serão removidos e o estoque será revertido automaticamente.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelBulkDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosVenda;
