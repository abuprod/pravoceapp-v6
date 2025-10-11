import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFilter, FaSort, FaSortUp, FaSortDown, FaTimes, FaExclamationTriangle, FaEllipsisV, FaColumns, FaGripVertical, FaCheck, FaCalendarAlt, FaClipboardList, FaExclamationCircle, FaBell, FaPencilAlt } from 'react-icons/fa';
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
  const [tipoOcorrenciaSelecionado, setTipoOcorrenciaSelecionado] = useState('');
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
  const [observacaoTemporaria, setObservacaoTemporaria] = useState({
    data: '',
    texto: ''
  });
  const [entradaEditandoIndex, setEntradaEditandoIndex] = useState(null);
  const [entregaEditandoIndex, setEntregaEditandoIndex] = useState(null);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // Estados para Alerta
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [alertaTemporario, setAlertaTemporario] = useState({
    dataAbertura: '',
    texto: ''
  });
  const [ordemAlertaAtual, setOrdemAlertaAtual] = useState(null);
  const [columnsConfig, setColumnsConfig] = useState([
    { key: 'numero', label: 'OC', visible: true },
    { key: 'tipo', label: 'Tipo', visible: true },
    { key: 'data', label: 'Data', visible: true },
    { key: 'fornecedor', label: 'Fornecedor', visible: true },
    { key: 'vendedor', label: 'Vendedor', visible: true },
    { key: 'status', label: 'Status', visible: true },
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
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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
    'Falta chegar outro', 
    'Agendado', 
    'Entregue', 
    'Não entregue (Ter obs)', 
    'Cancelado', 
    'Outro (Ter obs)'
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
      
      // Atualizar label da coluna 'numero' para 'OC'
      const numeroIndex = savedConfig.findIndex(col => col.key === 'numero');
      if (numeroIndex !== -1 && savedConfig[numeroIndex].label === 'Número') {
        savedConfig[numeroIndex].label = 'OC';
        localStorage.setItem('ordensCompraColumnsConfig', JSON.stringify(savedConfig));
        console.log('✅ Label da coluna atualizado para OC');
      }
      
      // Remover a coluna statusItem se ela existir (não é mais usada)
      const statusItemIndex = savedConfig.findIndex(col => col.key === 'statusItem');
      
      if (statusItemIndex !== -1) {
        const newConfig = savedConfig.filter(col => col.key !== 'statusItem');
        setColumnsConfig(newConfig);
        localStorage.setItem('ordensCompraColumnsConfig', JSON.stringify(newConfig));
        console.log('✅ Coluna de status de item removida automaticamente');
      } else {
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
      { key: 'numero', label: 'OC', visible: true },
      { key: 'tipo', label: 'Tipo', visible: true },
      { key: 'data', label: 'Data', visible: true },
      { key: 'fornecedor', label: 'Fornecedor', visible: true },
      { key: 'vendedor', label: 'Vendedor', visible: true },
      { key: 'status', label: 'Status', visible: true },
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
      
      // Calcular altura estimada do menu (baseado no número de opções)
      const menuHeight = 240; // Altura estimada do menu dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Se não há espaço suficiente abaixo e há espaço acima, posicionar acima
      let menuY;
      if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
        menuY = rect.top - menuHeight - 5;
      } else {
        menuY = rect.bottom + 5;
        
        // Se ainda assim não há espaço suficiente abaixo, fazer scroll automático
        if (spaceBelow < menuHeight) {
          // Encontrar o container da tabela e fazer scroll para baixo
          const tableContainer = document.querySelector('.overflow-x-auto');
          if (tableContainer) {
            const scrollAmount = menuHeight - spaceBelow + 20; // 20px de margem extra
            tableContainer.scrollBy({
              top: scrollAmount,
              behavior: 'smooth'
            });
          }
        }
      }
      
      setMenuPosition({
        x: rect.left,
        y: menuY
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
    setTipoOcorrenciaSelecionado('');
    setEntradaTemporaria({
      dataEntrada: '',
      documentoFabrica: '',
      dataDocumento: '',
      observacao: ''
    });
    setEntregaTemporaria({
      data: '',
      observacao: ''
    });
    setShowOcorrenciasModal(true);
  };

  const handleAbrirAlerta = (linha) => {
    setMenuAberto(null);
    setOrdemAlertaAtual(linha);
    
    // Se já existe um alerta no item específico, carregar os dados
    if (linha.produtoAtual && linha.produtoAtual.alerta) {
      setAlertaTemporario({
        dataAbertura: linha.produtoAtual.alerta.dataAbertura,
        texto: linha.produtoAtual.alerta.texto
      });
    } else {
      // Se não existe, criar novo com data atual
      const dataAtual = new Date().toISOString().split('T')[0];
      setAlertaTemporario({
        dataAbertura: dataAtual,
        texto: ''
      });
    }
    
    setShowAlertaModal(true);
  };

  const salvarAlerta = () => {
    if (!alertaTemporario.texto || alertaTemporario.texto.trim() === '') {
      alert('Por favor, preencha o texto do alerta.');
      return;
    }

    if (!ordemAlertaAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemAlertaAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    // Adicionar ou atualizar o alerta no item específico
    const indiceProduto = ordemAlertaAtual.indiceProduto || 0;
    if (!ordensExistentes[ordemIndex].itens[indiceProduto]) {
      alert('Item não encontrado!');
      return;
    }

    ordensExistentes[ordemIndex].itens[indiceProduto].alerta = {
      dataAbertura: alertaTemporario.dataAbertura,
      texto: alertaTemporario.texto
    };

    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));

    // Atualizar estado local
    setOrdensCompra(ordensExistentes);

    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowAlertaModal(false);
    setOrdemAlertaAtual(null);
    setAlertaTemporario({
      dataAbertura: '',
      texto: ''
    });

    alert('Alerta salvo com sucesso!');
  };

  const excluirAlerta = () => {
    if (!ordemAlertaAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemAlertaAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    // Remover o alerta do item específico
    const indiceProduto = ordemAlertaAtual.indiceProduto || 0;
    if (!ordensExistentes[ordemIndex].itens[indiceProduto]) {
      alert('Item não encontrado!');
      return;
    }

    delete ordensExistentes[ordemIndex].itens[indiceProduto].alerta;

    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));

    // Atualizar estado local
    setOrdensCompra(ordensExistentes);

    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowAlertaModal(false);
    setOrdemAlertaAtual(null);
    setAlertaTemporario({
      dataAbertura: '',
      texto: ''
    });

    alert('Alerta excluído com sucesso!');
  };

  const salvarEntradaLista = () => {
    if (!entradaTemporaria.dataEntrada) {
      alert('Por favor, preencha a data de entrada.');
      return;
    }

    if (!ordemModalAtual) return;

    // DEBUG
    alert(`DEBUG ENTRADA (ListaOC):\nItem Index: ${ordemModalAtual.indiceProduto}\nProduto: ${ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}\nDoc: ${entradaTemporaria.documentoFabrica}`);

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    let entradasAtualizadas;
    let ocorrenciasAtualizadas;

    // Se estiver editando uma entrada existente
    if (entradaEditandoIndex !== null) {
      // Atualizar entrada existente
      const ocorrenciaAtual = ordem.ocorrencias[entradaEditandoIndex];
      const entradaAtualizada = {
        ...entradaTemporaria,
        salvo: true,
        editando: false,
        itemIndex: ocorrenciaAtual.detalhes?.itemIndex || 0,
        produto: ocorrenciaAtual.detalhes?.produto || ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
      };

      // Atualizar ocorrência
      ocorrenciasAtualizadas = ordem.ocorrencias.map((ocorrencia, idx) => 
        idx === entradaEditandoIndex
          ? {
              ...ocorrencia,
              descricao: `Entrada registrada para ${entradaAtualizada.produto || 'produto'}. Documento: ${entradaAtualizada.documentoFabrica || 'N/A'}. Data: ${entradaAtualizada.dataEntrada}`,
              data: new Date().toISOString(),
              detalhes: entradaAtualizada
            }
          : ocorrencia
      );

      // Atualizar entrada se existir
      entradasAtualizadas = ordem.entradas ? ordem.entradas.map((entrada, idx) => {
        const ocorrenciaIndex = ordem.ocorrencias.findIndex(oc => oc.detalhes === entrada);
        return ocorrenciaIndex === entradaEditandoIndex ? entradaAtualizada : entrada;
      }) : [entradaAtualizada];

      setEntradaEditandoIndex(null);
    } else {
      // Criar nova entrada
      const novaEntrada = {
        ...entradaTemporaria,
        salvo: true,
        editando: false,
        itemIndex: ordemModalAtual.indiceProduto || 0,
        produto: ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
      };

      // Adicionar às entradas da ordem
      entradasAtualizadas = [...(ordem.entradas || []), novaEntrada];
      
      // Criar ocorrência
      const novaOcorrencia = {
        tipo: 'Entrada de Produto',
        descricao: `Entrada registrada para ${novaEntrada.produto || 'produto'}. Documento: ${novaEntrada.documentoFabrica || 'N/A'}. Data: ${novaEntrada.dataEntrada}`,
        data: new Date().toISOString(),
        detalhes: novaEntrada
      };

      // Adicionar às ocorrências
      ocorrenciasAtualizadas = [...(ordem.ocorrencias || []), novaOcorrencia];
    }

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
    
    // Atualizar ordemModalAtual se o modal de ocorrências estiver aberto
    if (showOcorrenciasModal) {
      setOrdemModalAtual({
        ...ordemModalAtual,
        ocorrencias: ocorrenciasAtualizadas
      });
    }
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowEntradaModal(false);
    if (!showOcorrenciasModal) {
      setOrdemModalAtual(null);
    }
    setEntradaTemporaria({
      dataEntrada: '',
      documentoFabrica: '',
      dataDocumento: '',
      observacao: ''
    });
    setTipoOcorrenciaSelecionado('');
    setEntradaEditandoIndex(null);

    alert('Entrada salva com sucesso!');
  };

  const salvarEntregaLista = () => {
    if (!entregaTemporaria.data) {
      alert('Por favor, preencha a data de entrega.');
      return;
    }

    if (!ordemModalAtual) return;

    // DEBUG
    alert(`DEBUG ENTREGA (ListaOC):\nItem Index: ${ordemModalAtual.indiceProduto}\nProduto: ${ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}\nData: ${entregaTemporaria.data}`);

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    let entregasAtualizadas;
    let ocorrenciasAtualizadas;

    // Se estiver editando uma entrega existente
    if (entregaEditandoIndex !== null) {
      // Atualizar entrega existente
      const ocorrenciaAtual = ordem.ocorrencias[entregaEditandoIndex];
      const entregaAtualizada = {
        ...entregaTemporaria,
        salvo: true,
        editando: false,
        itemIndex: ocorrenciaAtual.detalhes?.itemIndex || 0,
        produto: ocorrenciaAtual.detalhes?.produto || ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
      };

      // Atualizar ocorrência
      ocorrenciasAtualizadas = ordem.ocorrencias.map((ocorrencia, idx) => 
        idx === entregaEditandoIndex
          ? {
              ...ocorrencia,
              descricao: `Data de entrega atualizada para ${entregaAtualizada.produto || 'produto'}. Nova data: ${entregaAtualizada.data}`,
              data: new Date().toISOString(),
              detalhes: entregaAtualizada
            }
          : ocorrencia
      );

      // Atualizar entrega se existir
      entregasAtualizadas = ordem.datasEntrega ? ordem.datasEntrega.map((entrega, idx) => {
        const ocorrenciaIndex = ordem.ocorrencias.findIndex(oc => oc.detalhes === entrega);
        return ocorrenciaIndex === entregaEditandoIndex ? entregaAtualizada : entrega;
      }) : [entregaAtualizada];

      setEntregaEditandoIndex(null);
    } else {
      // Criar nova entrega
      const novaEntrega = {
        ...entregaTemporaria,
        salvo: true,
        editando: false,
        itemIndex: ordemModalAtual.indiceProduto || 0,
        produto: ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
      };

      // Adicionar às datas de entrega da ordem
      entregasAtualizadas = [...(ordem.datasEntrega || []), novaEntrega];
      
      // Criar ocorrência
      const novaOcorrencia = {
        tipo: 'Atualização de Entrega',
        descricao: `Data de entrega atualizada para ${novaEntrega.produto || 'produto'}. Nova data: ${novaEntrega.data}`,
        data: new Date().toISOString(),
        detalhes: novaEntrega
      };

      // Adicionar às ocorrências
      ocorrenciasAtualizadas = [...(ordem.ocorrencias || []), novaOcorrencia];
    }

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
    
    // Atualizar ordemModalAtual se o modal de ocorrências estiver aberto
    if (showOcorrenciasModal) {
      setOrdemModalAtual({
        ...ordemModalAtual,
        ocorrencias: ocorrenciasAtualizadas
      });
    }
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowEntregaModal(false);
    if (!showOcorrenciasModal) {
      setOrdemModalAtual(null);
    }
    setEntregaTemporaria({
      data: '',
      observacao: ''
    });
    setTipoOcorrenciaSelecionado('');
    setEntregaEditandoIndex(null);

    alert('Data de entrega salva com sucesso!');
  };

  const salvarObservacaoLista = () => {
    if (!observacaoTemporaria.data) {
      alert('Por favor, preencha a data da observação.');
      return;
    }

    if (!observacaoTemporaria.texto) {
      alert('Por favor, preencha o texto da observação.');
      return;
    }

    if (!ordemModalAtual) return;

    // DEBUG
    alert(`DEBUG OBSERVAÇÃO (ListaOC):\nItem Index: ${ordemModalAtual.indiceProduto}\nProduto: ${ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}\nTexto: ${observacaoTemporaria.texto}`);

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    // Criar nova observação
    const novaObservacao = {
      tipo: 'Observação',
      descricao: observacaoTemporaria.texto,
      data: new Date().toISOString(),
      detalhes: {
        dataObservacao: observacaoTemporaria.data,
        texto: observacaoTemporaria.texto,
        itemIndex: ordemModalAtual.indiceProduto || 0,
        produto: ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao
      }
    };

    // Adicionar às ocorrências
    const ocorrenciasAtualizadas = [...(ordem.ocorrencias || []), novaObservacao];

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
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));

    // Fechar modal e limpar
    setShowOcorrenciasModal(false);
    setOrdemModalAtual(null);
    setObservacaoTemporaria({
      data: '',
      texto: ''
    });

    alert('Observação salva com sucesso!');
  };

  // Função para excluir ocorrência
  const excluirOcorrencia = (indexOcorrencia) => {
    if (!window.confirm('Deseja realmente excluir esta ocorrência?')) return;
    
    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    const ordem = ordensExistentes[ordemIndex];
    
    // Remover ocorrência e manter consistência com entradas/datasEntrega
    const ocorrenciaRemovida = (ordem.ocorrencias || [])[indexOcorrencia];
    const ocorrenciasAtualizadas = (ordem.ocorrencias || []).filter((_, idx) => idx !== indexOcorrencia);

    let entradasAtualizadas = ordem.entradas || [];
    let datasEntregaAtualizadas = ordem.datasEntrega || [];

    if (ocorrenciaRemovida?.tipo === 'Entrada de Produto') {
      const d = ocorrenciaRemovida.detalhes || {};
      entradasAtualizadas = (ordem.entradas || []).filter(e => {
        return !(
          e.itemIndex === d.itemIndex &&
          e.dataEntrada === d.dataEntrada &&
          e.documentoFabrica === d.documentoFabrica
        );
      });
    } else if (ocorrenciaRemovida?.tipo === 'Atualização de Entrega') {
      const d = ocorrenciaRemovida.detalhes || {};
      datasEntregaAtualizadas = (ordem.datasEntrega || []).filter(ent => {
        return !(
          ent.itemIndex === d.itemIndex &&
          ent.data === d.data
        );
      });
    }

    // Atualizar ordem
    ordensExistentes[ordemIndex] = {
      ...ordem,
      ocorrencias: ocorrenciasAtualizadas,
      entradas: entradasAtualizadas,
      datasEntrega: datasEntregaAtualizadas,
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

  // Função para editar ocorrência inline
  const editarOcorrencia = (indexOcorrencia) => {
    setEntradaEditandoIndex(indexOcorrencia);
  };

  // Função para salvar edição inline
  const salvarEdicaoOcorrencia = (indexOcorrencia) => {
    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    // Atualizar a ordem com as ocorrências modificadas do modal
    ordensExistentes[ordemIndex] = {
      ...ordensExistentes[ordemIndex],
      ocorrencias: ordemModalAtual.ocorrencias,
      dataAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
    
    // Atualizar estado local
    setOrdensCompra(ordensExistentes);
    
    // Atualizar ordemModalAtual
    setOrdemModalAtual(ordensExistentes[ordemIndex]);
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));
    
    setEntradaEditandoIndex(null);
    alert('Ocorrência atualizada com sucesso!');
  };

  // Função para cancelar edição inline
  const cancelarEdicaoOcorrencia = () => {
    setEntradaEditandoIndex(null);
  };

  // Função para atualizar campo de ocorrência durante edição
  const atualizarCampoOcorrencia = (indexOcorrencia, campo, valor) => {
    if (!ordemModalAtual) return;
    
    const ocorrenciasAtualizadas = ordemModalAtual.ocorrencias.map((ocorrencia, idx) => {
      if (idx === indexOcorrencia) {
        return {
          ...ocorrencia,
          detalhes: {
            ...ocorrencia.detalhes,
            [campo]: valor
          }
        };
      }
      return ocorrencia;
    });

    setOrdemModalAtual({
      ...ordemModalAtual,
      ocorrencias: ocorrenciasAtualizadas
    });
  };

  // Função para editar ocorrência de entrega inline
  const editarOcorrenciaEntrega = (indexOcorrencia) => {
    setEntregaEditandoIndex(indexOcorrencia);
  };

  // Função para salvar edição inline de entrega
  const salvarEdicaoOcorrenciaEntrega = (indexOcorrencia) => {
    if (!ordemModalAtual) return;

    // Buscar a ordem completa no localStorage
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    const ordemIndex = ordensExistentes.findIndex(ordem => ordem.id == ordemModalAtual.id);
    
    if (ordemIndex === -1) {
      alert('Ordem não encontrada!');
      return;
    }

    // Atualizar a ordem com as ocorrências modificadas do modal
    ordensExistentes[ordemIndex] = {
      ...ordensExistentes[ordemIndex],
      ocorrencias: ordemModalAtual.ocorrencias,
      dataAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
    
    // Atualizar estado local
    setOrdensCompra(ordensExistentes);
    
    // Atualizar ordemModalAtual
    setOrdemModalAtual(ordensExistentes[ordemIndex]);
    
    // Disparar evento para sincronizar
    window.dispatchEvent(new CustomEvent('ordensCompraChanged'));
    
    setEntregaEditandoIndex(null);
    alert('Data de entrega atualizada com sucesso!');
  };

  // Função para cancelar edição inline de entrega
  const cancelarEdicaoOcorrenciaEntrega = () => {
    setEntregaEditandoIndex(null);
  };

  // Função para atualizar campo de ocorrência de entrega durante edição
  const atualizarCampoOcorrenciaEntrega = (indexOcorrencia, campo, valor) => {
    if (!ordemModalAtual) return;
    
    const ocorrenciasAtualizadas = ordemModalAtual.ocorrencias.map((ocorrencia, idx) => {
      if (idx === indexOcorrencia) {
        return {
          ...ocorrencia,
          detalhes: {
            ...ocorrencia.detalhes,
            [campo]: valor
          }
        };
      }
      return ocorrencia;
    });

    setOrdemModalAtual({
      ...ordemModalAtual,
      ocorrencias: ocorrenciasAtualizadas
    });
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

  // Funções de seleção múltipla
  const toggleItemSelecionado = (linhaId) => {
    setItensSelecionados(prev => {
      if (prev.includes(linhaId)) {
        return prev.filter(id => id !== linhaId);
      } else {
        return [...prev, linhaId];
      }
    });
  };

  const toggleTodosSelecionados = () => {
    if (itensSelecionados.length === filteredAndSortedOrdens.length) {
      setItensSelecionados([]);
    } else {
      setItensSelecionados(filteredAndSortedOrdens.map(ordem => ordem.linhaId));
    }
  };

  // Função para excluir múltiplos itens
  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    // Obter os IDs únicos das ordens a serem excluídas
    const idsParaExcluir = [...new Set(
      itensSelecionados.map(linhaId => {
        const linha = filteredAndSortedOrdens.find(o => o.linhaId === linhaId);
        return linha ? linha.id : null;
      }).filter(id => id !== null)
    )];

    // Remover as ordens do estado
    const novasOrdens = ordensCompra.filter(ordem => !idsParaExcluir.includes(ordem.id));
    setOrdensCompra(novasOrdens);
    
    // Atualizar o localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(novasOrdens));
    
    // Limpar seleção
    setItensSelecionados([]);
    setShowBulkDeleteModal(false);
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  // Função para imprimir ordens selecionadas
  const handleBulkPrint = () => {
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para imprimir.');
      return;
    }

    // Obter os IDs únicos das ordens selecionadas
    const idsParaImprimir = [...new Set(
      itensSelecionados.map(linhaId => {
        const linha = filteredAndSortedOrdens.find(o => o.linhaId === linhaId);
        return linha ? linha.id : null;
      }).filter(id => id !== null)
    )];

    // Buscar as ordens completas
    const ordensSelecionadas = ordensCompra.filter(ordem => idsParaImprimir.includes(ordem.id));

    // Gerar HTML para impressão
    gerarImpressao(ordensSelecionadas);
    setShowBulkActionsMenu(false);
  };

  // Função para gerar impressão
  const gerarImpressao = (ordens) => {
    const htmlImpressao = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ordens de Compra</title>
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
          .ordem {
            page-break-inside: avoid;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .ordem-header {
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .ordem-numero {
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
          }
          .status-aprovado { background-color: #d1fae5; color: #065f46; }
          .status-aberto { background-color: #fef3c7; color: #92400e; }
          .status-encomendado { background-color: #dbeafe; color: #1e40af; }
          .status-entregue { background-color: #d1fae5; color: #065f46; }
          .status-cancelado { background-color: #fee2e2; color: #991b1b; }
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
            .ordem { page-break-after: always; }
            .ordem:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 ORDENS DE COMPRA</h1>
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        ${ordens.map(ordem => `
          <div class="ordem">
            <div class="ordem-header">
              <div class="ordem-numero">OC Nº ${ordem.numero || ordem.oc || 'S/N'}</div>
              <span class="status status-${ordem.status?.toLowerCase().replace(/\s+/g, '-') || 'aberto'}">
                ${ordem.status?.toUpperCase() || 'EM ABERTO'}
              </span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Data:</span>
                <span class="info-value">${ordem.data ? new Date(ordem.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${ordem.tipo ? ordem.tipo.charAt(0).toUpperCase() + ordem.tipo.slice(1) : '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fornecedor:</span>
                <span class="info-value">${ordem.fornecedor || ordem.fornecedorNome || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${ordem.vendedor || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Prazo Final:</span>
                <span class="info-value">${ordem.prazoFinal ? new Date(ordem.prazoFinal + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pedido Vinculado:</span>
                <span class="info-value">${ordem.pedidoVinculado || '-'}</span>
              </div>
            </div>

            ${ordem.itens && ordem.itens.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 40%;">Produto</th>
                    <th style="width: 10%;">Qtd</th>
                    <th style="width: 15%;">Vlr. Unit.</th>
                    <th style="width: 15%;">Vlr. Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${ordem.itens.map(item => `
                    <tr>
                      <td>${item.codigo || '-'}</td>
                      <td>${item.produto || item.descricao || '-'}</td>
                      <td>${item.quantidade || 1}</td>
                      <td>R$ ${(item.valorUnitario || 0).toFixed(2)}</td>
                      <td>R$ ${(item.valorTotal || (item.quantidade * item.valorUnitario) || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="total">Total da Ordem: R$ ${(ordem.valor || 0).toFixed(2)}</div>
            ` : `
              <p style="color: #666; font-style: italic;">Nenhum item cadastrado nesta ordem.</p>
            `}

            ${ordem.observacoes ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #f9fafb; border-left: 3px solid #2563eb;">
                <strong>Observações:</strong>
                <p style="margin: 5px 0 0 0;">${ordem.observacoes}</p>
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

  const getStatusColor = (status) => {
    // Normalizar o status para comparação
    const statusNormalizado = status?.toLowerCase().replace(/\s+/g, '_') || '';
    
    const colors = {
      'em_aberto': 'bg-yellow-100 text-yellow-800',
      'aprovado': 'bg-green-100 text-green-800',
      'encomendado': 'bg-blue-100 text-blue-800',
      'em_depósito': 'bg-purple-100 text-purple-800',
      'aguardando_outra_oc': 'bg-orange-100 text-orange-800',
      'agendado': 'bg-indigo-100 text-indigo-800',
      'entregue_parcial': 'bg-cyan-100 text-cyan-800',
      'entregue': 'bg-green-100 text-green-800',
      'não_entregue_(ter_obs)': 'bg-red-100 text-red-800',
      'cancelado': 'bg-red-100 text-red-800',
      'outro_(ter_obs)': 'bg-gray-100 text-gray-800'
    };
    
    return colors[statusNormalizado] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    // Normalizar o status para comparação
    const statusNormalizado = status?.toLowerCase().replace(/\s+/g, '_') || '';
    
    const labels = {
      'em_aberto': 'EM ABERTO',
      'aprovado': 'APROVADO',
      'encomendado': 'ENCOMENDADO',
      'em_depósito': 'EM DEPÓSITO',
      'aguardando_outra_oc': 'AGUARDANDO OUTRA OC',
      'agendado': 'AGENDADO',
      'entregue_parcial': 'ENTREGUE PARCIAL',
      'entregue': 'ENTREGUE',
      'não_entregue_(ter_obs)': 'NÃO ENTREGUE (TER OBS)',
      'cancelado': 'CANCELADO',
      'outro_(ter_obs)': 'OUTRO (TER OBS)'
    };
    
    return labels[statusNormalizado] || status?.toUpperCase() || 'EM ABERTO';
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={itensSelecionados.length === filteredAndSortedOrdens.length && filteredAndSortedOrdens.length > 0}
                  onChange={toggleTodosSelecionados}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  title="Selecionar todos"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              {columnsConfig.filter(col => col.visible).map(column => {
                const sortKey = column.key === 'prazo' ? 'prazoFinal' : 
                               column.key === 'pedido' ? 'pedidoVinculado' : column.key;
                
                return (
                  <th 
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort(sortKey)}
                  >
                    <div className="flex items-center justify-center">
                      {column.label}
                      {getSortIcon(sortKey)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedOrdens.map((ordem) => (
              <tr key={ordem.linhaId || ordem.id || Date.now()} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <input
                    type="checkbox"
                    checked={itensSelecionados.includes(ordem.linhaId)}
                    onChange={() => toggleItemSelecionado(ordem.linhaId)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
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
                          <div className="flex items-center gap-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                              {getStatusLabel(ordem.status)}
                            </span>
                            {ordem.produtoAtual && ordem.produtoAtual.alerta && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirAlerta(ordem);
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Ver alerta"
                              >
                                <FaExclamationCircle className="text-lg" />
                              </button>
                            )}
                          </div>
                        );
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
                        column.key === 'status' ? '' : 'text-gray-500'
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
                handleAbrirOcorrencias(window.linhaAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaClipboardList className="mr-3 text-purple-600" />
              Ocorrências
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAbrirAlerta(window.linhaAtual);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaBell className="mr-3 text-yellow-600" />
              Alerta
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
              Você está prestes a excluir <strong>{itensSelecionados.length}</strong> {itensSelecionados.length === 1 ? 'item selecionado' : 'itens selecionados'}.
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Esta ação não poderá ser desfeita. Todas as ordens de compra selecionadas serão removidas permanentemente.
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de emissão do doc.</label>
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
            
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Produto:</strong> {ordemModalAtual.produtoAtual?.produto || ordemModalAtual.produtoAtual?.descricao || 'N/A'}
              </p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Histórico de Ocorrências:</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {ordemModalAtual.ocorrencias && ordemModalAtual.ocorrencias.length > 0 ? (
                  <div className="space-y-3">
                    {(ordemModalAtual.ocorrencias || [])
                      .map((o, idx) => ({ ocorrencia: o, indexReal: idx }))
                      .filter(({ ocorrencia }) => ocorrencia.detalhes?.itemIndex === ordemModalAtual.indiceProduto)
                      .map(({ ocorrencia, indexReal }) => (
                      <div key={indexReal} className="border-l-4 border-purple-500 pl-4 pr-2 relative">
                        {entradaEditandoIndex === indexReal && ocorrencia.tipo === 'Entrada de Produto' ? (
                          // Modo de edição inline - Entrada
                          <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-900">{ocorrencia.tipo}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => salvarEdicaoOcorrencia(indexReal)}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 transition-colors"
                                  title="Salvar alterações"
                                >
                                  <FaCheck className="text-xs" />
                                </button>
                                <button
                                  onClick={() => cancelarEdicaoOcorrencia()}
                                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1 transition-colors"
                                  title="Cancelar edição"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Data Entrada</label>
                                <input
                                  type="date"
                                  value={ocorrencia.detalhes?.dataEntrada || ''}
                                  onChange={(e) => atualizarCampoOcorrencia(indexReal, 'dataEntrada', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Documento Fábrica</label>
                                <input
                                  type="text"
                                  value={ocorrencia.detalhes?.documentoFabrica || ''}
                                  onChange={(e) => atualizarCampoOcorrencia(indexReal, 'documentoFabrica', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Número do documento"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Data de emissão do doc.</label>
                              <input
                                type="date"
                                value={ocorrencia.detalhes?.dataDocumento || ''}
                                onChange={(e) => atualizarCampoOcorrencia(indexReal, 'dataDocumento', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                              <textarea
                                value={ocorrencia.detalhes?.observacao || ''}
                                onChange={(e) => atualizarCampoOcorrencia(indexReal, 'observacao', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                rows="2"
                                placeholder="Digite as observações..."
                              />
                            </div>
                          </div>
                        ) : entregaEditandoIndex === indexReal && ocorrencia.tipo === 'Atualização de Entrega' ? (
                          // Modo de edição inline - Entrega
                          <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-900">{ocorrencia.tipo}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => salvarEdicaoOcorrenciaEntrega(indexReal)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
                                  title="Salvar alterações"
                                >
                                  <FaCheck className="text-xs" />
                                </button>
                                <button
                                  onClick={() => cancelarEdicaoOcorrenciaEntrega()}
                                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1 transition-colors"
                                  title="Cancelar edição"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Data Entrega *</label>
                              <input
                                type="date"
                                value={ocorrencia.detalhes?.data || ''}
                                onChange={(e) => atualizarCampoOcorrenciaEntrega(indexReal, 'data', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                              <textarea
                                value={ocorrencia.detalhes?.observacao || ''}
                                onChange={(e) => atualizarCampoOcorrenciaEntrega(indexReal, 'observacao', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="Digite as observações..."
                              />
                            </div>
                          </div>
                        ) : (
                          // Modo de visualização
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm font-medium text-gray-900">{ocorrencia.tipo}</p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {ocorrencia.tipo !== 'Entrada de Produto' && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(ocorrencia.data).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                                {ocorrencia.tipo === 'Entrada de Produto' && (
                                  <button
                                    onClick={() => editarOcorrencia(indexReal)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
                                    title="Editar ocorrência"
                                  >
                                    <FaPencilAlt className="text-xs" />
                                  </button>
                                )}
                                {ocorrencia.tipo === 'Atualização de Entrega' && (
                                  <button
                                    onClick={() => editarOcorrenciaEntrega(indexReal)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
                                    title="Editar data de entrega"
                                  >
                                    <FaPencilAlt className="text-xs" />
                                  </button>
                                )}
                                <button
                                  onClick={() => excluirOcorrencia(indexReal)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                                  title="Excluir ocorrência"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </div>
                            </div>
                            
                            {ocorrencia.tipo === 'Entrada de Produto' ? (
                              // Visualização estruturada para Entrada de Produto
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Data Entrada:</p>
                                    <p className="text-gray-900">
                                      {ocorrencia.detalhes?.dataEntrada ? new Date(ocorrencia.detalhes.dataEntrada + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Documento Nº:</p>
                                    <p className="text-gray-900">{ocorrencia.detalhes?.documentoFabrica || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">Data Emissão Doc:</p>
                                    <p className="text-gray-900">
                                      {ocorrencia.detalhes?.dataDocumento ? new Date(ocorrencia.detalhes.dataDocumento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                    </p>
                                  </div>
                                </div>
                                {ocorrencia.detalhes?.observacao && (
                                  <div className="mt-2 pt-2 border-t border-purple-200">
                                    <p className="text-xs font-medium text-gray-700">Observações:</p>
                                    <p className="text-xs text-gray-600 mt-1">{ocorrencia.detalhes.observacao}</p>
                                  </div>
                                )}
                              </div>
                            ) : ocorrencia.tipo === 'Atualização de Entrega' ? (
                              // Visualização estruturada para Data de Entrega
                              <div className="space-y-2">
                                <div className="text-sm">
                                  <p className="text-xs font-medium text-gray-700">Data Entrega:</p>
                                  <p className="text-gray-900">
                                    {ocorrencia.detalhes?.data ? new Date(ocorrencia.detalhes.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                  </p>
                                </div>
                                {ocorrencia.detalhes?.observacao && (
                                  <div className="mt-2 pt-2 border-t border-purple-200">
                                    <p className="text-xs font-medium text-gray-700">Observações:</p>
                                    <p className="text-xs text-gray-600 mt-1">{ocorrencia.detalhes.observacao}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Visualização padrão para outros tipos
                              <div>
                                <p className="text-sm text-gray-600">{ocorrencia.descricao}</p>
                                {ocorrencia.detalhes?.observacao && (
                                  <div className="mt-2 pt-2 border-t border-purple-200">
                                    <p className="text-xs font-medium text-gray-700">Observações:</p>
                                    <p className="text-xs text-gray-600 mt-1">{ocorrencia.detalhes.observacao}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma ocorrência registrada.</p>
                )}
              </div>
            </div>
            
            {entradaEditandoIndex === null && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Nova Ocorrência:</h4>
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select 
                    value={tipoOcorrenciaSelecionado}
                    onChange={(e) => setTipoOcorrenciaSelecionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="entrada">Dar entrada</option>
                    <option value="entrega">Data entrega</option>
                    <option value="observacao">Observação</option>
                  </select>
                </div>

                {/* Campos para Dar Entrada */}
                {tipoOcorrenciaSelecionado === 'entrada' && (
                  <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de emissão do doc.</label>
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
                )}

                {/* Campos para Data Entrega */}
                {tipoOcorrenciaSelecionado === 'entrega' && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
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
                )}

                {/* Campos para Observação */}
                {tipoOcorrenciaSelecionado === 'observacao' && (
                  <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={observacaoTemporaria.data}
                          onChange={(e) => setObservacaoTemporaria({...observacaoTemporaria, data: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <button
                          type="button"
                          onClick={() => setObservacaoTemporaria({...observacaoTemporaria, data: new Date().toISOString().split('T')[0]})}
                          className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex items-center gap-2"
                          title="Definir data atual"
                        >
                          <FaCalendarAlt className="text-sm" />
                          Hoje
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observação *</label>
                      <textarea
                        value={observacaoTemporaria.texto}
                        onChange={(e) => setObservacaoTemporaria({...observacaoTemporaria, texto: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        rows="4"
                        placeholder="Digite a observação..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOcorrenciasModal(false);
                  setOrdemModalAtual(null);
                  setTipoOcorrenciaSelecionado('');
                  setEntradaEditandoIndex(null);
                  setEntregaEditandoIndex(null);
                  setEntradaTemporaria({
                    dataEntrada: '',
                    documentoFabrica: '',
                    dataDocumento: '',
                    observacao: ''
                  });
                  setEntregaTemporaria({
                    data: '',
                    observacao: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
              {tipoOcorrenciaSelecionado === 'entrada' && (
                <button
                  onClick={() => {
                    salvarEntradaLista();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaCheck />
                  {entradaEditandoIndex !== null ? 'Salvar Alterações' : 'Salvar Entrada'}
                </button>
              )}
              {tipoOcorrenciaSelecionado === 'entrega' && (
                <button
                  onClick={() => {
                    salvarEntregaLista();
                    setShowOcorrenciasModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaCalendarAlt />
                  Salvar Data Entrega
                </button>
              )}
              {tipoOcorrenciaSelecionado === 'observacao' && (
                <button
                  onClick={() => {
                    salvarObservacaoLista();
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <FaClipboardList />
                  Salvar Observação
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Alerta */}
      {showAlertaModal && ordemAlertaAtual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaBell className="text-yellow-600" />
                Alerta - OC {ordemAlertaAtual.oc} - Item {(ordemAlertaAtual.indiceProduto || 0) + 1}
              </h3>
              <button
                onClick={() => {
                  setShowAlertaModal(false);
                  setOrdemAlertaAtual(null);
                  setAlertaTemporario({ dataAbertura: '', texto: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Abertura do Alerta
              </label>
              <input
                type="date"
                value={alertaTemporario.dataAbertura}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta data é definida automaticamente e não pode ser editada
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto do Alerta *
              </label>
              <textarea
                value={alertaTemporario.texto}
                onChange={(e) => setAlertaTemporario({...alertaTemporario, texto: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows="4"
                placeholder="Digite o texto do alerta..."
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  setShowAlertaModal(false);
                  setOrdemAlertaAtual(null);
                  setAlertaTemporario({ dataAbertura: '', texto: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
              
              <div className="flex gap-2">
                {ordemAlertaAtual.produtoAtual && ordemAlertaAtual.produtoAtual.alerta && (
                  <button
                    onClick={excluirAlerta}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaTrash />
                    Excluir Alerta
                  </button>
                )}
                <button
                  onClick={salvarAlerta}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <FaCheck />
                  Salvar Alerta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaOrdensCompra; 