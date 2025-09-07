import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFilter, FaSort, FaSortUp, FaSortDown, FaTimes, FaExclamationTriangle, FaEllipsisV } from 'react-icons/fa';
import { createPortal } from 'react-dom';

const ListaOrdensCompra = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ordemToDelete, setOrdemToDelete] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
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

  // Carregar ordens do localStorage ao montar o componente
  useEffect(() => {
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

  const filteredAndSortedOrdens = ordensCompra
    .filter(ordem => {
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
    .sort((a, b) => {
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

  const toggleMenu = (ordemId, event) => {
    event.stopPropagation();
    
    if (menuAberto === ordemId) {
      setMenuAberto(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: rect.left,
        y: rect.bottom + 5
      });
      setMenuAberto(ordemId);
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

  // Encontrar a ordem atual do menu
  const ordemAtual = ordensCompra.find(o => o.id == menuAberto);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Compra</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FaFilter /> Filtros
          </button>
          {hasActiveFilters() && (
            <button
              onClick={limparFiltros}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FaTimes /> Limpar Filtros
            </button>
          )}
        <button
          onClick={() => navigate('/ordens-compra/novo')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('numero')}
              >
                <div className="flex items-center">
                Número
                  {getSortIcon('numero')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tipo')}
              >
                <div className="flex items-center">
                  Tipo
                  {getSortIcon('tipo')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('data')}
              >
                <div className="flex items-center">
                  Data
                  {getSortIcon('data')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fornecedor')}
              >
                <div className="flex items-center">
                Fornecedor
                  {getSortIcon('fornecedor')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('vendedor')}
              >
                <div className="flex items-center">
                Vendedor
                  {getSortIcon('vendedor')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('prazoFinal')}
              >
                <div className="flex items-center">
                  Prazo
                  {getSortIcon('prazoFinal')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('pedidoVinculado')}
              >
                <div className="flex items-center">
                  PED
                  {getSortIcon('pedidoVinculado')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedOrdens.map((ordem) => (
              <tr key={ordem.id || Date.now()} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm relative">
                  <div className="menu-dropdown">
                    <button
                      onClick={(e) => toggleMenu(ordem.id, e)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      title="Opções"
                    >
                      <FaEllipsisV />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleNumeroClick(ordem.id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                  >
                    {ordem.numero || ordem.oc || '-'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.tipo ? ordem.tipo.charAt(0).toUpperCase() + ordem.tipo.slice(1) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatarDataSemTimezone(ordem.data)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.fornecedor || ordem.fornecedorNome || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.vendedor || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                    {(ordem.status || 'Em aberto').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  R$ {(ordem.valor || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    {formatarDataSemTimezone(ordem.prazoFinal)}
                    {ordem.prazoAlteradoManualmente && (
                      <span className="ml-1 text-red-500 font-bold" title="Prazo alterado manualmente">*</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ordem.pedidoVinculado || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Menu Dropdown Global */}
      {menuAberto && ordemAtual && createPortal(
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
                handleEdit(ordemAtual.id);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 menu-actions"
            >
              <FaEdit className="mr-3 text-blue-600" />
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(ordemAtual.id);
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
    </div>
  );
};

export default ListaOrdensCompra; 