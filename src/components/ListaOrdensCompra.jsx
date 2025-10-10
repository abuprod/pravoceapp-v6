import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFilter, FaSort, FaSortUp, FaSortDown, FaTimes, FaExclamationTriangle, FaEllipsisV, FaColumns, FaGripVertical, FaCheck, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import { createPortal } from 'react-dom';

// Componente para item arrastável
const DraggableColumnItem = ({ column, index, onToggle, onDragStart, onDragEnd, onDragOver, onDrop }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index);
    onDragStart(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onDrop(dragIndex, index);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex items-center p-3 border border-gray-200 rounded-lg mb-2 cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 transform scale-95' : 'hover:bg-gray-50 hover:shadow-sm'
      }`}
    >
      <FaGripVertical className="text-gray-400 mr-3 flex-shrink-0" />
      <label className="flex items-center flex-grow cursor-pointer">
        <input
          type="checkbox"
          checked={column.visible}
          onChange={() => onToggle(column.key)}
          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm font-medium text-gray-700">{column.label}</span>
      </label>
    </div>
  );
};

const ListaOrdensCompra = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ordemToDelete, setOrdemToDelete] = useState(null);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [showOcorrenciasModal, setShowOcorrenciasModal] = useState(false);
  const [ordemModalAtual, setOrdemModalAtual] = useState(null);
  const [entradaTemporaria, setEntradaTemporaria] = useState({
    dataEntrada: '',
    documentoFabrica: '',
    dataDocumento: '',
    observacao: ''
  });
  const [entregaTemporaria, setEntregaTemporaria] = useState({
    data: '',
    observacao: ''
  });
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [columnsConfig, setColumnsConfig] = useState([
    { key: 'numero', label: 'Número', visible: true },
    { key: 'tipo', label: 'Tipo', visible: true },
    { key: 'data', label: 'Data', visible: true },
    { key: 'fornecedor', label: 'Fornecedor', visible: true },
    { key: 'vendedor', label: 'Vendedor', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'statusItem', label: '•', visible: true },
    { key: 'produto', label: 'Produto', visible: true },
    { key: 'valor', label: 'Valor', visible: true },
    { key: 'prazo', label: 'Prazo', visible: true },
    { key: 'pedido', label: 'PED', visible: true }
  ]);
  const [filters, setFilters] = useState({
    tipo: '',
    status: [],
    statusInput: '',
    dataInicio: '',
    dataFim: '',
    fornecedor: '',
    vendedor: [],
    vendedorInput: '',
    valorMin: '',
    valorMax: ''
  });
  const [ordensCompra, setOrdensCompra] = useState([]);

  // Função para converter data sem problemas de timezone
  const formatarDataSemTimezone = (dataString) => {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const tipoOptions = ['cliente', 'estoque', 'assistencia'];
  const statusOptions = [
    'Em aberto', 
    'Aprovado', 
    'Encomendado', 
    'Em depósito', 
    'Aguardando outra oc', 
    'Agendado', 
    'Entregue parcial', 
    'Entregue', 
    'Não entregue (ter obs)', 
    'Cancelado', 
    'Outro (ter obs)'
  ];

  // Obter lista única de vendedores das ordens existentes
  const vendedorOptions = [...new Set(
    ordensCompra
      .map(ordem => ordem.vendedor)
      .filter(vendedor => vendedor && vendedor.trim() !== '')
  )].sort();

  // Carregar preferências de colunas do localStorage
  useEffect(() => {
    const columnsPrefs = localStorage.getItem('ordensCompraColumnsConfig');
    if (columnsPrefs) {
      const savedConfig = JSON.parse(columnsPrefs);
      
      // Verificar se a coluna statusItem existe, se não, adicionar
      const statusItemIndex = savedConfig.findIndex(col => col.key === 'statusItem');
      
      if (statusItemIndex === -1) {
        // Adicionar coluna statusItem após a coluna 'status'
        const statusIndex = savedConfig.findIndex(col => col.key === 'status');
        const newConfig = [...savedConfig];
        newConfig.splice(statusIndex + 1, 0, { key: 'statusItem', label: '•', visible: true });
        setColumnsConfig(newConfig);
        // Salvar a configuração atualizada
        localStorage.setItem('ordensCompraColumnsConfig', JSON.stringify(newConfig));
        console.log('✅ Coluna de status de item adicionada automaticamente');
      } else {
        // Se a coluna existe mas está oculta, torná-la visível
        if (!savedConfig[statusItemIndex].visible) {
          savedConfig[statusItemIndex].visible = true;
          localStorage.setItem('ordensCompraColumnsConfig', JSON.stringify(savedConfig));
          console.log('✅ Coluna de status de item ativada automaticamente');
        }
        setColumnsConfig(savedConfig);
      }
    }
  }, []);

  // Carregar ordens do localStorage ao montar o componente
  useEffect(() => {
    const carregarOrdens = () => {
      const ordensSalvas = localStorage.getItem('ordensCompra');
      if (ordensSalvas) {
        const ordens = JSON.parse(ordensSalvas);
        
        // CORREÇÃO: Adicionar ID para ordens que não têm
        const ordensCorrigidas = ordens.map((ordem, index) => {
          if (!ordem.id || ordem.id === undefined || ordem.id === null) {
            return {
              ...ordem,
              id: Date.now() + index // ID único baseado em timestamp + índice
            };
          }
          return ordem;
        });
        
        // Salvar ordens corrigidas se houve mudanças
        if (ordensCorrigidas.some((ordem, index) => ordem.id !== ordens[index].id)) {
          localStorage.setItem('ordensCompra', JSON.stringify(ordensCorrigidas));
          setOrdensCompra(ordensCorrigidas);
        } else {
          setOrdensCompra(ordens);
        }
      }
    };

    // Carregar inicialmente
    carregarOrdens();

    // Listener para mudanças no localStorage (quando ordem é editada)
    const handleStorageChange = (e) => {
      if (e.key === 'ordensCompra') {
        console.log('🔄 Detectada alteração nas ordens de compra, recarregando lista...');
        carregarOrdens();
      }
    };

    // Listener customizado para mudanças no mesmo tab
    const handleCustomStorageChange = () => {
      console.log('🔄 Detectada alteração customizada nas ordens de compra, recarregando lista...');
      carregarOrdens();
    };

    // Adicionar listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ordensCompraChanged', handleCustomStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ordensCompraChanged', handleCustomStorageChange);
    };
  }, []);

  // Salvar ordens no localStorage quando houver mudanças
  useEffect(() => {
    if (ordensCompra.length > 0) {
      localStorage.setItem('ordensCompra', JSON.stringify(ordensCompra));
    }
  }, [ordensCompra]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAberto && !event.target.closest('.menu-actions')) {
        setMenuAberto(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuAberto]);

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
    } else if (campo === 'vendedor') {
      setFilters(prev => ({
        ...prev,
        vendedor: prev.vendedor.includes(valor) 
          ? prev.vendedor.filter(v => v !== valor)
          : [...prev.vendedor, valor]
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
      tipo: '',
      status: [],
      statusInput: '',
      dataInicio: '',
      dataFim: '',
      fornecedor: '',
      vendedor: [],
      vendedorInput: '',
      valorMin: '',
      valorMax: ''
    });
  };

  // Funções para controlar colunas
  const handleColumnToggle = (columnKey) => {
    setColumnsConfig(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleColumnReorder = (dragIndex, hoverIndex) => {
    if (dragIndex === hoverIndex) return;
    
    setColumnsConfig(prev => {
      const newColumns = [...prev];
      const draggedColumn = newColumns[dragIndex];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, draggedColumn);
      return newColumns;
    });
  };

  // Funções para drag and drop
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (index) => {
    // Não faz nada, apenas previne o comportamento padrão
  };

  const handleDrop = (dragIndex, hoverIndex) => {
    handleColumnReorder(dragIndex, hoverIndex);
  };

  const saveColumnsPreferences = () => {
    localStorage.setItem('ordensCompraColumnsConfig', JSON.stringify(columnsConfig));
    setShowColumnsModal(false);
  };

  const resetColumns = () => {
    const defaultColumns = [
      { key: 'numero', label: 'Número', visible: true },
      { key: 'tipo', label: 'Tipo', visible: true },
      { key: 'data', label: 'Data', visible: true },
      { key: 'fornecedor', label: 'Fornecedor', visible: true },
      { key: 'vendedor', label: 'Vendedor', visible: true },
      { key: 'status', label: 'Status', visible: true },
      { key: 'statusItem', label: '•', visible: true },
      { key: 'produto', label: 'Produto', visible: true },
      { key: 'valor', label: 'Valor', visible: true },
      { key: 'prazo', label: 'Prazo', visible: true },
      { key: 'pedido', label: 'PED', visible: true }
    ];
    setColumnsConfig(defaultColumns);
  };

  // Função para verificar se há filtros ativos
  const hasActiveFilters = () => {
    return (
      filters.tipo !== '' ||
      filters.status.length > 0 ||
      filters.dataInicio !== '' ||
      filters.dataFim !== '' ||
      filters.fornecedor !== '' ||
      filters.vendedor.length > 0 ||
      filters.valorMin !== '' ||
      filters.valorMax !== ''
    );
  };

  // Expandir ordens em linhas por produto
  const expandirOrdensPorProduto = (ordens) => {
    const linhasExpandidas = [];
    
    ordens.forEach(ordem => {
      if (ordem.itens && ordem.itens.length > 0) {
        // Criar uma linha para cada produto
        ordem.itens.forEach((item, index) => {
          linhasExpandidas.push({
            ...ordem,
            // Adicionar informações do produto específico
            produtoAtual: item,
            indiceProduto: index,
            // ID único para cada linha (ordem + produto)
            linhaId: `${ordem.id}_${index}`,
            // Valor específico do produto
            valorProduto: item.valorTotal || (item.quantidade * item.valorUnitario) || 0
          });
        });
      } else {
        // Se não tem itens, manter a linha original
        linhasExpandidas.push({
          ...ordem,
          linhaId: `${ordem.id}_0`,
          valorProduto: ordem.valor || 0
        });
      }
    });
    
    return linhasExpandidas;
  };

  const filteredAndSortedOrdens = expandirOrdensPorProduto(
    ordensCompra.filter(ordem => {
      const matchesSearch = 
        (ordem.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ordem.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ordem.vendedor || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = !filters.tipo || ordem.tipo === filters.tipo;
      
      const matchesStatus = filters.status.length === 0 || 
        filters.status.includes(ordem.status);
      
      const matchesFornecedor = !filters.fornecedor || 
        (ordem.fornecedor || '').toLowerCase().includes(filters.fornecedor.toLowerCase());
      
      const matchesVendedor = filters.vendedor.length === 0 || 
        filters.vendedor.includes(ordem.vendedor);
      
      const matchesData = (!filters.dataInicio || new Date(ordem.data) >= new Date(filters.dataInicio)) &&
        (!filters.dataFim || new Date(ordem.data) <= new Date(filters.dataFim));

      const matchesValor = (!filters.valorMin || (ordem.valor || 0) >= parseFloat(filters.valorMin)) &&
        (!filters.valorMax || (ordem.valor || 0) <= parseFloat(filters.valorMax));

      return matchesSearch && matchesTipo && matchesStatus && matchesFornecedor && matchesVendedor && matchesData && matchesValor;
    })
  ).sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'data') {
      return sortDirection === 'asc' 
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    }
    
    return sortDirection === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const toggleMenu = (linha, event) => {
    event.stopPropagation();
    
    if (menuAberto === linha.linhaId) {
      setMenuAberto(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: rect.left,
        y: rect.bottom + 5
      });
      setMenuAberto(linha.linhaId);
      // Guardar informações da linha atual para usar no menu
      window.linhaAtual = linha;
    }
  };

  const handleEdit = (id) => {
    setMenuAberto(null);
    // Verificar se a ordem existe antes de navegar
    const ordensSalvas = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemExiste = ordensSalvas.find(ordem => ordem.id == id);
    
    if (ordemExiste) {
      setTimeout(() => {
        navigate(`/ordens-compra/editar/${id}`);
      }, 100);
    } else {
      alert(`Erro: Ordem com ID ${id} não encontrada!`);
    }
  };


  const handleNumeroClick = (id) => {
    // Verificar se a ordem existe antes de navegar
    const ordensSalvas = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemExiste = ordensSalvas.find(ordem => ordem.id == id);
    
    if (ordemExiste) {
      setTimeout(() => {
        navigate(`/ordens-compra/editar/${id}`);
      }, 100);
    } else {
      alert(`Erro: Ordem com ID ${id} não encontrada!`);
    }
  };

  const handleDelete = (id) => {
    setMenuAberto(null);
    setOrdemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = (linha) => {
    setMenuAberto(null);
    setProductToDelete(linha);
    setShowDeleteProductModal(true);
  };

  const handleAbrirEntrada = (linha) => {
    setMenuAberto(null);
    setOrdemModalAtual(linha);
    setEntradaTemporaria({
      dataEntrada: '',
      documentoFabrica: '',
      dataDocumento: '',
      observacao: ''
    });
    setShowEntradaModal(true);
  };

  const handleAbrirEntrega = (linha) => {
    setMenuAberto(null);
    setOrdemModalAtual(linha);
    setEntregaTemporaria({
      data: '',
      observacao: ''
    });
    setShowEntregaModal(true);
  };

  const handleAbrirOcorrencias = (linha) => {
    setMenuAberto(null);
    setOrdemModalAtual(linha);
    setShowOcorrenciasModal(true);
  };

  const salvarEntradaLista = () => {
    if (!entradaTemporaria.dataEntrada) {
      alert('Por favor, preencha a data de entrada.');
      return;
    }

    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id === ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    // Criar nova entrada
    const novaEntrada = {
      ...entradaTemporaria,
      salvo: true,
      editando: false,
      itemIndex: ordemModalAtual.indiceProduto || 0,
      produto: ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
    };

    // Adicionar às entradas da ordem
    const entradasAtualizadas = [...(ordem.entradas || []), novaEntrada];
    
    // Criar ocorrência
    const novaOcorrencia = {
      tipo: 'Entrada de Produto',
      descricao: `Entrada registrada para ${novaEntrada.produto || 'produto'}. Documento: ${novaEntrada.documentoFabrica || 'N/A'}. Data: ${novaEntrada.dataEntrada}`,
      data: new Date().toISOString(),
      detalhes: novaEntrada
    };

    // Adicionar às ocorrências
    const ocorrenciasAtualizadas = [...(ordem.ocorrencias || []), novaOcorrencia];

    // Atualizar ordem
    ordensExistentes[ordemIndex] = {
      ...ordem,
      entradas: entradasAtualizadas,
      ocorrencias: ocorrenciasAtualizadas,
      dataAtualizacao: new Date().toISOString()
    };

    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
    
    // Atualizar estado local
    setOrdensCompra(ordensExistentes);
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowEntradaModal(false);
    setOrdemModalAtual(null);
    setEntradaTemporaria({
      dataEntrada: '',
      documentoFabrica: '',
      dataDocumento: '',
      observacao: ''
    });

    alert('Entrada salva com sucesso!');
  };

  const salvarEntregaLista = () => {
    if (!entregaTemporaria.data) {
      alert('Por favor, preencha a data de entrega.');
      return;
    }

    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id === ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    // Criar nova entrega
    const novaEntrega = {
      ...entregaTemporaria,
      salvo: true,
      editando: false,
      itemIndex: ordemModalAtual.indiceProduto || 0,
      produto: ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
    };

    // Adicionar às datas de entrega da ordem
    const entregasAtualizadas = [...(ordem.datasEntrega || []), novaEntrega];
    
    // Criar ocorrência
    const novaOcorrencia = {
      tipo: 'Atualização de Entrega',
      descricao: `Data de entrega atualizada para ${novaEntrega.produto || 'produto'}. Nova data: ${novaEntrega.data}`,
      data: new Date().toISOString(),
      detalhes: novaEntrega
    };

    // Adicionar às ocorrências
    const ocorrenciasAtualizadas = [...(ordem.ocorrencias || []), novaOcorrencia];

    // Atualizar ordem
    ordensExistentes[ordemIndex] = {
      ...ordem,
      datasEntrega: entregasAtualizadas,
      ocorrencias: ocorrenciasAtualizadas,
      dataAtualizacao: new Date().toISOString()
    };

    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
    
    // Atualizar estado local
    setOrdensCompra(ordensExistentes);
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowEntregaModal(false);
    setOrdemModalAtual(null);
    setEntregaTemporaria({
      data: '',
      observacao: ''
    });

    alert('Data de entrega salva com sucesso!');
  };

  // Função para excluir ocorrência
  const excluirOcorrencia = (indexOcorrencia) => {
    if (!window.confirm('Deseja realmente excluir esta ocorrência?')) return;
    
    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id === ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    // Remover ocorrência
    const ocorrenciasAtualizadas = (ordem.ocorrencias || []).filter((_, idx) => idx !== indexOcorrencia);

    // Atualizar ordem
    ordensExistentes[ordemIndex] = {
      ...ordem,
      ocorrencias: ocorrenciasAtualizadas,
      dataAtualizacao: new Date().toISOString()
    };

    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
    
    // Atualizar estado local
    setOrdensCompra(ordensExistentes);
    
    // Atualizar ordemModalAtual
    setOrdemModalAtual({
      ...ordemModalAtual,
      ocorrencias: ocorrenciasAtualizadas
    });
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
      
      // Encontrar a ordem que contém o produto
      const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id === productToDelete.id);
      
      if (ordemIndex !== -1) {
        const ordem = ordensExistentes[ordemIndex];
        
        // Remover o produto específico da lista de itens
        if (ordem.itens && ordem.itens.length > 0) {
          const novosItens = ordem.itens.filter((_, index) => index !== productToDelete.indiceProduto);
          
          if (novosItens.length === 0) {
            // Se não restaram produtos, excluir a ordem inteira
            ordensExistentes.splice(ordemIndex, 1);
          } else {
            // Atualizar a ordem com os novos itens e recalcular valor
            const novoValor = novosItens.reduce((total, item) => 
              total + (item.valorTotal || (item.quantidade * item.valorUnitario) || 0), 0
            );
            
            ordensExistentes[ordemIndex] = {
              ...ordem,
              itens: novosItens,
              valor: novoValor,
              dataAtualizacao: new Date().toISOString()
            };
          }
          
          // Salvar no localStorage
          localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
          
          // Atualizar o estado local
          setOrdensCompra(ordensExistentes);
          
          // Disparar evento para sincronizar com outras telas
          window.dispatchEvent(new CustomEvent('ordensCompraChanged'));
        }
      }
      
      // Fechar modal
      setShowDeleteProductModal(false);
      setProductToDelete(null);
    }
  };

  const cancelDeleteProduct = () => {
    setShowDeleteProductModal(false);
    setProductToDelete(null);
  };

  const confirmDelete = () => {
    if (ordemToDelete) {
      // Remover a ordem do estado - usar comparação flexível para compatibilidade com diferentes tipos de ID
      const novasOrdens = ordensCompra.filter(ordem => ordem.id != ordemToDelete);
      setOrdensCompra(novasOrdens);
      
      // Atualizar o localStorage
      localStorage.setItem('ordensCompra', JSON.stringify(novasOrdens));
      
      // Fechar o modal e limpar o estado
      setShowDeleteModal(false);
      setOrdemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setOrdemToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'em aberto':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'encomendado':
        return 'bg-blue-100 text-blue-800';
      case 'em depósito':
        return 'bg-purple-100 text-purple-800';
      case 'aguardando outra oc':
        return 'bg-orange-100 text-orange-800';
      case 'agendado':
        return 'bg-indigo-100 text-indigo-800';
      case 'entregue parcial':
        return 'bg-cyan-100 text-cyan-800';
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'não entregue (ter obs)':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'outro (ter obs)':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para determinar o status do item baseado em entradas e entregas
  const getStatusItem = (ordem, produtoAtual, indiceProduto) => {
    // Se não há dados de entradas e entregas, retorna pendente
    if (!ordem.entradas && !ordem.datasEntrega) {
      return 'pending'; // Amarelo - sem entrada
    }

    // Verificar se há entrada para este produto específico
    const temEntrada = ordem.entradas && ordem.entradas.some(entrada => 
      entrada.itemIndex === (indiceProduto || 0) && entrada.dataEntrada
    );

    // Verificar se há entrega para este produto específico
    const temEntrega = ordem.datasEntrega && ordem.datasEntrega.some(entrega => 
      entrega.itemIndex === (indiceProduto || 0) && entrega.data
    );

    if (temEntrega) {
      return 'delivered'; // Verde - com entrega
    } else if (temEntrada) {
      return 'received'; // Lilás - com entrada
    } else {
      return 'pending'; // Amarelo - sem entrada
    }
  };

  // Função para renderizar a bolinha de status
  const renderStatusItem = (ordem, produtoAtual, indiceProduto) => {
    const status = getStatusItem(ordem, produtoAtual, indiceProduto);
    
    let colorClass = '';
    let title = '';
    
    switch (status) {
      case 'pending':
        colorClass = 'bg-yellow-400';
        title = 'Aguardando entrada';
        break;
      case 'received':
        colorClass = 'bg-purple-500';
        title = 'Entrada registrada';
        break;
      case 'delivered':
        colorClass = 'bg-green-500';
        title = 'Entregue';
        break;
      default:
        colorClass = 'bg-yellow-400'; // Sempre mostrar amarelo por padrão
        title = 'Aguardando entrada';
    }

    return (
      <div className="flex items-center justify-center">
        <div 
          className={`w-5 h-5 rounded-full ${colorClass} shadow-sm`}
          title={title}
        />
      </div>
    );
  };

  // Encontrar a ordem atual do menu (removido para evitar conflito com estado)
  // const ordemModalAtual = ordensCompra.find(o => o.id == menuAberto);

  return (
    <div className="p-6">
      <div className="flex items-center mb-6 gap-6">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Compra</h1>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setShowColumnsModal(true)}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <FaColumns /> Ver Colunas
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
          >
            <FaFilter /> Filtros
          </button>
          {hasActiveFilters() && (
            <button
              onClick={limparFiltros}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
            >
              <FaTimes /> Limpar Filtros
            </button>
          )}
        <button
          onClick={() => navigate('/ordens-compra/novo')}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
            <FaPlus /> Nova Ordem de Compra
        </button>
        </div>
      </div>

      {/* Modal de Filtros */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
              {/* Filtro de Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={filters.tipo}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {tipoOptions.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</option>
                  ))}
                </select>
              </div>

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
                    placeholder="Digite o status ou selecione da lista..."
                    list="status-options"
                  />
                  <datalist id="status-options">
                    {statusOptions.map(status => (
                      <option key={status} value={status} />
                    ))}
                  </datalist>
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
                <div className="mt-1 text-xs text-gray-500">
                  💡 Digite um status e clique fora ou pressione Enter para adicionar
                </div>
              </div>

              {/* Filtro de Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={filters.fornecedor}
                  onChange={(e) => handleFilterChange('fornecedor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filtrar por fornecedor"
                />
              </div>

              {/* Filtro de Vendedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.vendedorInput || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters(prev => ({
                        ...prev,
                        vendedorInput: value
                      }));
                    }}
                    onBlur={() => {
                      if (filters.vendedorInput.trim()) {
                        const newVendedor = filters.vendedorInput.trim();
                        if (!filters.vendedor.includes(newVendedor)) {
                          setFilters(prev => ({
                            ...prev,
                            vendedor: [...prev.vendedor, newVendedor],
                            vendedorInput: ''
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            vendedorInput: ''
                          }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filters.vendedorInput.trim()) {
                        e.preventDefault();
                        const newVendedor = filters.vendedorInput.trim();
                        if (!filters.vendedor.includes(newVendedor)) {
                          setFilters(prev => ({
                            ...prev,
                            vendedor: [...prev.vendedor, newVendedor],
                            vendedorInput: ''
                          }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o vendedor ou selecione da lista..."
                    list="vendedor-options"
                  />
                  <datalist id="vendedor-options">
                    {vendedorOptions.map(vendedor => (
                      <option key={vendedor} value={vendedor} />
                    ))}
                  </datalist>
                </div>
                {filters.vendedor.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filters.vendedor.map((vendedor, index) => (
                      <span
                        key={`${vendedor}-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {vendedor}
                        <button
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              vendedor: prev.vendedor.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  💡 Digite um vendedor e clique fora ou pressione Enter para adicionar
                </div>
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
            </div>

            <div className="p-6 pt-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex justify-end gap-2">
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
        </div>
      )}

      {/* Modal de Seleção de Colunas */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">Selecionar Colunas</h3>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Escolha e reordene as colunas arrastando:
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <FaGripVertical className="mr-1" />
                  Arraste para reordenar
                </div>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {columnsConfig.map((column, index) => (
                  <DraggableColumnItem
                    key={column.key}
                    column={column}
                    index={index}
                    onToggle={handleColumnToggle}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 pt-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex justify-between">
                <button
                  onClick={resetColumns}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mostrar Todas
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowColumnsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveColumnsPreferences}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por número, fornecedor ou vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              {columnsConfig.filter(col => col.visible).map(column => {
                const sortKey = column.key === 'prazo' ? 'prazoFinal' : 
                               column.key === 'pedido' ? 'pedidoVinculado' : column.key;
                
                return (
                  <th 
                    key={column.key}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${
                      column.key === 'statusItem' ? 'text-center w-16' : 'text-left'
                    }`}
                    onClick={() => handleSort(sortKey)}
                  >
                    <div className="flex items-center justify-center">
                      {column.label}
                      {column.key !== 'statusItem' && getSortIcon(sortKey)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedOrdens.map((ordem) => (
              <tr key={ordem.linhaId || ordem.id || Date.now()} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm relative">
                  <div className="menu-dropdown">
                    <button
                      onClick={(e) => toggleMenu(ordem, e)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      title="Opções"
                    >
                      <FaEllipsisV />
                    </button>
                  </div>
                </td>
                {columnsConfig.filter(col => col.visible).map(column => {
                  const renderCell = () => {
                    switch (column.key) {
                      case 'numero':
                        return (
                          <button
                            onClick={() => handleNumeroClick(ordem.id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                          >
                            {ordem.numero || ordem.oc || '-'}
                          </button>
                        );
                      case 'tipo':
                        return ordem.tipo ? ordem.tipo.charAt(0).toUpperCase() + ordem.tipo.slice(1) : '-';
                      case 'data':
                        return formatarDataSemTimezone(ordem.data);
                      case 'fornecedor':
                        return ordem.produtoAtual?.fornecedor || ordem.produtoAtual?.fornecedorNome || ordem.fornecedor || ordem.fornecedorNome || '-';
                      case 'vendedor':
                        return ordem.vendedor || '-';
                      case 'status':
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                            {(ordem.status || 'Em aberto').toUpperCase()}
                          </span>
                        );
                      case 'statusItem':
                        return renderStatusItem(ordem, ordem.produtoAtual, ordem.indiceProduto);
                      case 'produto':
                        return ordem.produtoAtual ? (
                          <div>
                            <div className="font-medium text-gray-900">{ordem.produtoAtual.produto || ordem.produtoAtual.descricao}</div>
                            <div className="text-xs text-gray-500">Qtd: {ordem.produtoAtual.quantidade || 1}</div>
                          </div>
                        ) : '-';
                      case 'valor':
                        return `R$ ${(ordem.valorProduto || ordem.valor || 0).toFixed(2)}`;
                      case 'prazo':
                        return (
                          <div className="flex items-center">
                            {formatarDataSemTimezone(ordem.prazoFinal)}
                            {ordem.prazoAlteradoManualmente && (
                              <span className="ml-1 text-red-500 font-bold" title="Prazo alterado manualmente">*</span>
                            )}
                          </div>
                        );
                      case 'pedido':
                        return ordem.pedidoVinculado || '-';
                      default:
                        return '-';
                    }
                  };

                  return (
                    <td 
                      key={column.key}
                      className={`px-4 py-4 whitespace-nowrap text-sm ${
                        column.key === 'numero' ? 'font-medium' : 
                        column.key === 'status' ? '' : 
                        column.key === 'statusItem' ? 'text-center' : 'text-gray-500'
                      }`}
                    >
                      {renderCell()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Menu Dropdown Global */}
      {menuAberto && window.linhaAtual && createPortal(
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
                handleEdit(window.linhaAtual.id);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaEdit className="mr-3 text-blue-600" />
              Editar Ordem
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirEntrada(window.linhaAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaCheck className="mr-3 text-green-600" />
              Dar entrada
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirEntrega(window.linhaAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaCalendarAlt className="mr-3 text-blue-600" />
              Data entrega
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirOcorrencias(window.linhaAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaClipboardList className="mr-3 text-purple-600" />
              Ocorrências
            </button>
            
            {/* Mostrar opção de excluir produto apenas se há produto específico e mais de um item na ordem */}
            {window.linhaAtual.produtoAtual && window.linhaAtual.itens && window.linhaAtual.itens.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProduct(window.linhaAtual);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
              >
                <FaTrash className="mr-3 text-orange-600" />
                Excluir Produto
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(window.linhaAtual.id);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaTrash className="mr-3 text-red-600" />
              Excluir Ordem Completa
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta ordem de compra? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3">
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

      {/* Modal de Confirmação de Exclusão de Produto */}
      {showDeleteProductModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão do Produto
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o produto <strong>{productToDelete.produtoAtual?.produto || productToDelete.produtoAtual?.descricao}</strong> desta ordem de compra?
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              O produto será removido da ordem {productToDelete.numero} e o valor total será recalculado automaticamente.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteProduct}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Excluir Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dar Entrada */}
      {showEntradaModal && ordemModalAtual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-600">
                Dar Entrada - OC {ordemModalAtual.numero || ordemModalAtual.oc}
              </h3>
              <button
                onClick={() => setShowEntradaModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Produto:</strong> {ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Entrada *</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={entradaTemporaria.dataEntrada}
                      onChange={(e) => setEntradaTemporaria({...entradaTemporaria, dataEntrada: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setEntradaTemporaria({...entradaTemporaria, dataEntrada: new Date().toISOString().split('T')[0]})}
                      className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                      title="Definir data atual"
                    >
                      <FaCalendarAlt className="text-sm" />
                      Hoje
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documento Fábrica</label>
                  <input
                    type="text"
                    value={entradaTemporaria.documentoFabrica}
                    onChange={(e) => setEntradaTemporaria({...entradaTemporaria, documentoFabrica: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Número do documento"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Documento</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={entradaTemporaria.dataDocumento}
                    onChange={(e) => setEntradaTemporaria({...entradaTemporaria, dataDocumento: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEntradaTemporaria({...entradaTemporaria, dataDocumento: new Date().toISOString().split('T')[0]})}
                    className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                    title="Definir data atual"
                  >
                    <FaCalendarAlt className="text-sm" />
                    Hoje
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={entradaTemporaria.observacao}
                  onChange={(e) => setEntradaTemporaria({...entradaTemporaria, observacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Digite as observações da entrada..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEntradaModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEntradaLista}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaCheck />
                Salvar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Data Entrega */}
      {showEntregaModal && ordemModalAtual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-600">
                Data Entrega - OC {ordemModalAtual.numero || ordemModalAtual.oc}
              </h3>
              <button
                onClick={() => setShowEntregaModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Produto:</strong> {ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Entrega *</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={entregaTemporaria.data}
                    onChange={(e) => setEntregaTemporaria({...entregaTemporaria, data: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEntregaTemporaria({...entregaTemporaria, data: new Date().toISOString().split('T')[0]})}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Definir data atual"
                  >
                    <FaCalendarAlt className="text-sm" />
                    Hoje
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={entregaTemporaria.observacao}
                  onChange={(e) => setEntregaTemporaria({...entregaTemporaria, observacao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Digite as observações da entrega..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEntregaModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEntregaLista}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaCalendarAlt />
                Salvar Data Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ocorrências */}
      {showOcorrenciasModal && ordemModalAtual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <FaClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ocorrências - OC {ordemModalAtual.numero || ordemModalAtual.oc}
              </h3>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Histórico de Ocorrências:</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {ordemModalAtual.ocorrencias && ordemModalAtual.ocorrencias.length > 0 ? (
                  <div className="space-y-3">
                    {ordemModalAtual.ocorrencias.map((ocorrencia, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4 pr-2 relative">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{ocorrencia.tipo}</p>
                            <p className="text-sm text-gray-600">{ocorrencia.descricao}</p>
                            {ocorrencia.detalhes?.observacao && (
                              <div className="mt-2 pt-2 border-t border-purple-200">
                                <p className="text-xs font-medium text-gray-700">Observações:</p>
                                <p className="text-xs text-gray-600 mt-1">{ocorrencia.detalhes.observacao}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                            </span>
                            <button
                              onClick={() => excluirOcorrencia(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                              title="Excluir ocorrência"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma ocorrência registrada.</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Nova Ocorrência:</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Selecione o tipo</option>
                    <option value="entrada">Entrada de Produto</option>
                    <option value="entrega">Atualização de Entrega</option>
                    <option value="observacao">Observação</option>
                    <option value="problema">Problema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Descreva a ocorrência..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOcorrenciasModal(false);
                  setOrdemAtual(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  // Aqui você pode implementar a lógica para adicionar ocorrência
                  alert('Funcionalidade de adicionar ocorrência será implementada!');
                  setShowOcorrenciasModal(false);
                  setOrdemAtual(null);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Adicionar Ocorrência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaOrdensCompra; 