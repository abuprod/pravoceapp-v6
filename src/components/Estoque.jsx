import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FaHistory, FaSearch, FaExclamationCircle, FaClock, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Adicionar ErrorBoundary no topo do arquivo
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-bold">Erro no componente:</h2>
          <pre className="mt-2 text-red-600 whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Estoque = () => {
  const navigate = useNavigate();
  // Helpers para data/hora locais
  const getLocalDateString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const getLocalTimeString = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const [isLancamentoOpen, setIsLancamentoOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [filtrosHistorico, setFiltrosHistorico] = useState({
    dataInicio: '',
    dataFim: '',
    descricao: '',
    tipo: '',
    local: ''
  });
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [selecionados, setSelecionados] = useState(new Set());
  const [menuHistoricoAberto, setMenuHistoricoAberto] = useState(false);

  const [lancamentoData, setLancamentoData] = useState({
    data: getLocalDateString(),
    hora: getLocalTimeString(),
    tipo: 'Entrada',
    fornecedor: '',
    descricao: '',
    quantidade: '',
    observacao: '',
    local: '',
    preco: ''
  });

  const [observacaoQuantidade, setObservacaoQuantidade] = useState({
    isOpen: false,
    produto: null,
    local: null,
    observacao: '',
    cor: 'amarelo' // Cor padrão
  });

  // Estados para sugestões de produtos
  const [produtosCadastrados, setProdutosCadastrados] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [produtoNaoCadastrado, setProdutoNaoCadastrado] = useState(false);

  // Carregar locais ativos
  const [locais, setLocais] = useState([]);
  
  useEffect(() => {
    const carregarLocais = () => {
      const dadosSalvos = localStorage.getItem('locais');
      if (dadosSalvos) {
        const todosLocais = JSON.parse(dadosSalvos);
        const locaisAtivos = todosLocais
          .filter(local => local.status === 'Ativo')
          .map(local => local.sigla);
        
        // Ordenar para DP aparecer primeiro
        const locaisOrdenados = locaisAtivos.sort((a, b) => {
          if (a === 'DP') return -1;
          if (b === 'DP') return 1;
          return a.localeCompare(b);
        });
        
        setLocais(locaisOrdenados);
      }
    };

    carregarLocais();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'locais') {
        carregarLocais();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Carregar produtos cadastrados
  useEffect(() => {
    const carregarProdutos = () => {
      try {
        const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
        // Filtrar apenas produtos ativos (se houver campo status)
        const produtosAtivos = produtos.filter(produto => 
          !produto.status || produto.status === 'ativo' || produto.status === 'Ativo'
        );
        setProdutosCadastrados(produtosAtivos);
        setProdutos(produtosAtivos); // Também carregar para a tabela principal
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProdutosCadastrados([]);
        setProdutos([]);
      }
    };

    carregarProdutos();
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarProdutos, 5000);
    return () => clearInterval(interval);
  }, []);

  // Inicializar produtos vazios (sem o produto de exemplo)
  const [produtos, setProdutos] = useState([]);

  // Transformando historicoLancamentos em estado
  const [historicoLancamentos, setHistoricoLancamentos] = useState([]);

  // Carregar histórico de lançamentos do localStorage
  useEffect(() => {
    const carregarHistorico = () => {
      try {
        const historicoSalvo = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
        console.log(`📊 Estoque.jsx: Carregando histórico - ${historicoSalvo.length} lançamentos encontrados`);
        setHistoricoLancamentos(historicoSalvo);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setHistoricoLancamentos([]);
      }
    };

    carregarHistorico();
    
    // Recarregar a cada 2 segundos para sincronização
    const interval = setInterval(carregarHistorico, 2000);
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'historicoLancamentos') {
        carregarHistorico();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filtragem dos produtos baseada na busca global
  const produtosFiltradosGlobal = produtos.filter(produto => {
    const termoBusca = buscaGlobal.toLowerCase();
    const matchBusca = produto.descricao.toLowerCase().includes(termoBusca) ||
           produto.fornecedor.toLowerCase().includes(termoBusca);
    
    // Verificar se o produto tem estoque em pelo menos um local
    const temEstoque = locais.some(local => {
      const estoqueLocal = produto.estoque?.[local];
      return estoqueLocal && estoqueLocal.quantidade > 0;
    });
    
    return matchBusca && temEstoque;
  });

  // Função para filtrar produtos para sugestões
  const filtrarProdutosSugestao = (termo) => {
    const termoLower = (termo || '').toLowerCase();
    if (!termo || termo.length < 2) {
      setProdutosFiltrados([]);
      setProdutoNaoCadastrado(false);
      return;
    }

    const filtrados = produtosCadastrados
      .filter((produto) =>
        produto.descricao?.toLowerCase().includes(termoLower) ||
        produto.sku?.toLowerCase().includes(termoLower) ||
        produto.fornecedor?.toLowerCase().includes(termoLower)
      )
      .slice(0, 10); // Limitar a 10 sugestões

    setProdutosFiltrados(filtrados);

    const existeMatchExato = produtosCadastrados.some(
      (p) =>
        p.descricao?.toLowerCase() === termoLower ||
        p.sku?.toLowerCase() === termoLower
    );
    setProdutoNaoCadastrado(!existeMatchExato && filtrados.length === 0);
  };

  // Função para selecionar produto da sugestão
  const selecionarProduto = (produto) => {
    setLancamentoData(prev => ({
      ...prev,
      descricao: produto.descricao,
      fornecedor: produto.fornecedor,
      preco: produto.tabc ? parseFloat(produto.tabc).toFixed(2) : ''
    }));
    setMostrarSugestoes(false);
    setProdutoNaoCadastrado(false);
  };

  // Função para navegar para a página do produto
  const navegarParaProduto = (produto) => {
    navigate(`/produtos/novo/${produto.id || produto.sku}`);
  };

  // Função para lidar com mudança na descrição
  const handleDescricaoChange = (e) => {
    const valor = e.target.value;
    setLancamentoData(prev => ({ ...prev, descricao: valor }));
    
    if (valor.length >= 2) {
      filtrarProdutosSugestao(valor);
      setMostrarSugestoes(true);

      // Preencher automaticamente se houver match exato por descrição ou SKU
      const valorLower = valor.toLowerCase();
      const produtoExato = produtosCadastrados.find(
        (p) =>
          p.descricao?.toLowerCase() === valorLower ||
          p.sku?.toLowerCase() === valorLower
      );
      if (produtoExato) {
        setLancamentoData((prev) => ({
          ...prev,
          descricao: produtoExato.descricao,
          fornecedor: produtoExato.fornecedor,
          preco: produtoExato.tabc ? parseFloat(produtoExato.tabc).toFixed(2) : prev.preco,
        }));
        setProdutoNaoCadastrado(false);
        setMostrarSugestoes(false);
      }
    } else {
      setMostrarSugestoes(false);
      setProdutoNaoCadastrado(false);
    }
  };

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sugestoes-container')) {
        setMostrarSugestoes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLancamentoSubmit = (e) => {
    e.preventDefault();
    
    if (!lancamentoData.descricao || !lancamentoData.quantidade || !lancamentoData.local) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validar existência do produto por descrição ou SKU exato
    const termo = (lancamentoData.descricao || '').toLowerCase();
    const existeProduto = produtosCadastrados.some(
      (p) =>
        p.descricao?.toLowerCase() === termo ||
        p.sku?.toLowerCase() === termo
    );
    if (!existeProduto) {
      setProdutoNaoCadastrado(true);
      alert('Item não cadastrado. Selecione um produto existente.');
      return;
    }

    try {
      const novoLancamento = {
        id: Date.now() + Math.random(),
        data: lancamentoData.data,
        hora: lancamentoData.hora,
        tipo: lancamentoData.tipo,
        fornecedor: lancamentoData.fornecedor,
        descricao: lancamentoData.descricao,
        quantidade: parseInt(lancamentoData.quantidade),
        observacao: lancamentoData.observacao,
        local: lancamentoData.local,
        preco: lancamentoData.preco ? parseFloat(lancamentoData.preco) : null
      };

      // Buscar histórico existente
      const historicoExistente = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
      
      // Adicionar novo lançamento
      const novoHistorico = [...historicoExistente, novoLancamento];
      
      // Salvar no localStorage
      localStorage.setItem('historicoLancamentos', JSON.stringify(novoHistorico));
      
      // Atualizar estado local
      setHistoricoLancamentos(novoHistorico);
      
      // Atualizar estoque do produto
      if (lancamentoData.tipo === 'Entrada') {
        const produtoEncontrado = produtos.find(p => p.descricao === lancamentoData.descricao);
        if (produtoEncontrado) {
          const estoqueAtual = produtoEncontrado.estoque[lancamentoData.local]?.quantidade || 0;
          const novaQuantidade = estoqueAtual + parseInt(lancamentoData.quantidade);
          
          const produtosAtualizados = produtos.map(p => {
            if (p.descricao === lancamentoData.descricao) {
              return {
                ...p,
                estoque: {
                  ...p.estoque,
                  [lancamentoData.local]: {
                    ...p.estoque[lancamentoData.local],
                    quantidade: novaQuantidade
                  }
                }
              };
            }
            return p;
          });
          
          setProdutos(produtosAtualizados);
          localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
        }
      } else if (lancamentoData.tipo === 'Saída') {
        const produtoEncontrado = produtos.find(p => p.descricao === lancamentoData.descricao);
        if (produtoEncontrado) {
          const estoqueAtual = produtoEncontrado.estoque[lancamentoData.local]?.quantidade || 0;
          const novaQuantidade = Math.max(0, estoqueAtual - parseInt(lancamentoData.quantidade));
          
          const produtosAtualizados = produtos.map(p => {
            if (p.descricao === lancamentoData.descricao) {
              return {
                ...p,
                estoque: {
                  ...p.estoque,
                  [lancamentoData.local]: {
                    ...p.estoque[lancamentoData.local],
                    quantidade: novaQuantidade
                  }
                }
              };
            }
            return p;
          });
          
          setProdutos(produtosAtualizados);
          localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
        }
      }
      
      // Limpar formulário com data/hora local atuais
      setLancamentoData({
        data: getLocalDateString(),
        hora: getLocalTimeString(),
        tipo: 'Entrada',
        fornecedor: '',
        descricao: '',
        quantidade: '',
        observacao: '',
        local: '',
        preco: ''
      });
      
      // Fechar modal
      setIsLancamentoOpen(false);
      
      alert('Lançamento realizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert('Erro ao salvar lançamento. Tente novamente.');
    }
  };

  const handleFiltroHistorico = (e) => {
    const { name, value } = e.target;
    setFiltrosHistorico(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const historicoFiltrado = historicoLancamentos.filter(lancamento => {
    const matchDataInicio = !filtrosHistorico.dataInicio || lancamento.data >= filtrosHistorico.dataInicio;
    const matchDataFim = !filtrosHistorico.dataFim || lancamento.data <= filtrosHistorico.dataFim;
    const matchDescricao = !filtrosHistorico.descricao || 
      lancamento.descricao.toLowerCase().includes(filtrosHistorico.descricao.toLowerCase());
    const matchTipo = !filtrosHistorico.tipo || lancamento.tipo === filtrosHistorico.tipo;
    const matchLocal = !filtrosHistorico.local || lancamento.local === filtrosHistorico.local;

    return matchDataInicio && matchDataFim && matchDescricao && matchTipo && matchLocal;
  });

  // Converter data/hora salva em timestamp local para ordenação correta
  const obterTimestampLocal = (entrada) => {
    try {
      const [yyyy, mm, dd] = (entrada.data || '').split('-').map((n) => parseInt(n, 10));
      const [hh, min] = (entrada.hora || '00:00').split(':').slice(0, 2).map((n) => parseInt(n, 10));
      if (!yyyy || !mm || !dd) return 0;
      return new Date(yyyy, (mm || 1) - 1, dd || 1, hh || 0, min || 0).getTime();
    } catch {
      return 0;
    }
  };

  // Ordenação configurável pelo usuário (Data/Hora)
  const [ordenacaoData, setOrdenacaoData] = useState('desc');
  const historicoParaExibir = ordenacaoData
    ? [...historicoFiltrado].sort((a, b) => {
        const aMs = obterTimestampLocal(a);
        const bMs = obterTimestampLocal(b);
        return ordenacaoData === 'asc' ? aMs - bMs : bMs - aMs;
      })
    : historicoFiltrado;

  // Log para debug dos filtros - CORRIGIDO
  useEffect(() => {
    if (historicoLancamentos.length > 0) {
      console.log(`🔍 Estoque.jsx: Filtros aplicados - ${historicoLancamentos.length} total, ${historicoFiltrado.length} filtrados`);
      console.log('🔍 Filtros ativos:', filtrosHistorico);
      
      // LOG ESPECÍFICO: Mostrar os últimos lançamentos para debug
      const ultimosLancamentos = historicoLancamentos.slice(-5);
      console.log('🔍 Últimos 5 lançamentos no histórico:', ultimosLancamentos);
      
      // LOG ESPECÍFICO: Mostrar o que está sendo exibido na tabela
      console.log('🔍 Lançamentos que serão exibidos na tabela:', historicoFiltrado);
      
      // LOG ESPECÍFICO: Verificar se há lançamentos de "Nova venda"
      const lancamentosNovaVenda = historicoFiltrado.filter(l => l.observacao && l.observacao.includes('Nova venda'));
      console.log('🔍 Lançamentos de "Nova venda" encontrados:', lancamentosNovaVenda);
    }
  }, [historicoLancamentos, historicoFiltrado.length, filtrosHistorico]);

  const handleQuantidadeClick = (produto, local) => {
    const estoqueLocal = produto.estoque?.[local] || { quantidade: 0, observacao: '', cor: null };
    setObservacaoQuantidade({
      isOpen: true,
      produto,
      local,
      observacao: estoqueLocal.observacao || '',
      cor: estoqueLocal.cor || 'amarelo'
    });
  };

  // Função para formatar data no padrão brasileiro (sem timezone UTC)
  const formatarDataBrasileira = (data) => {
    if (!data) return '-';
    try {
      // Espera 'YYYY-MM-DD'; evita parsing UTC do new Date('YYYY-MM-DD')
      const [yyyy, mm, dd] = data.split('-').map(Number);
      if (!yyyy || !mm || !dd) return data;
      const dataObj = new Date(yyyy, mm - 1, dd);
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return data;
    }
  };

  const handleSalvarObservacao = () => {
    const { produto, local, observacao, cor } = observacaoQuantidade;
    
    console.log('🔍 Salvando observação:', { produto: produto?.descricao, local, observacao, cor });
    console.log('🔍 Produto original:', produto);
    console.log('🔍 Produtos atuais:', produtos.length);
    
    // Atualizar produtos no estado local
    const produtosAtualizados = produtos.map(p => {
      // Usar comparação por ID ou descrição para garantir que encontramos o produto correto
      if (p.id === produto.id || p.descricao === produto.descricao) {
        console.log('🔍 Produto encontrado para atualizar:', p.descricao);
        console.log('🔍 Estoque atual do produto:', p.estoque);
        
        const novoEstoque = {
          ...p.estoque,
          [local]: {
            quantidade: p.estoque?.[local]?.quantidade || 0,
            observacao: observacao,
            cor: cor // Sempre salvar a cor escolhida, incluindo amarelo
          }
        };
        
        console.log('🔍 Novo estoque:', novoEstoque);
        
        return {
          ...p,
          estoque: novoEstoque
        };
      }
      return p;
    });
    
    console.log('🔍 Produtos atualizados:', produtosAtualizados.length);
    
    setProdutos(produtosAtualizados);
    
    // Salvar no localStorage
    localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
    console.log('🔍 Salvo no localStorage');
    
    // Atualizar produtosCadastrados também
    setProdutosCadastrados(produtosAtualizados);

    setObservacaoQuantidade({ isOpen: false, produto: null, local: null, observacao: '', cor: 'amarelo' });
    
    console.log('🔍 Modal fechado');
  };

  // Seleção em massa no histórico (não afeta estoque)
  const isSelecionado = (id) => selecionados.has(id);
  const toggleSelecionado = (id) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  };
  const isTodosSelecionados = historicoParaExibir.length > 0 && historicoParaExibir.every(l => selecionados.has(l.id));
  const toggleSelecionarTodos = () => {
    setSelecionados(prev => {
      if (isTodosSelecionados) return new Set();
      const todos = new Set(historicoParaExibir.map(l => l.id));
      return todos;
    });
  };
  const excluirLancamentosSelecionados = () => {
    if (selecionados.size === 0) {
      alert('Selecione ao menos um lançamento para excluir.');
      return;
    }
    if (!confirm(`Excluir ${selecionados.size} lançamento(s) do histórico? Essa ação não afeta o estoque.`)) return;
    const idsParaExcluir = new Set(selecionados);
    const historicoAtual = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
    const atualizado = historicoAtual.filter(l => !idsParaExcluir.has(l.id));
    localStorage.setItem('historicoLancamentos', JSON.stringify(atualizado));
    setHistoricoLancamentos(atualizado);
    setSelecionados(new Set());
    setMenuHistoricoAberto(false);
  };

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Controle de Estoque</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsHistoricoOpen(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <FaHistory /> Histórico de Lançamentos
            </button>
            <button
              onClick={() => {
                setLancamentoData((prev) => ({
                  ...prev,
                  data: getLocalDateString(),
                  hora: getLocalTimeString(),
                }));
                setIsLancamentoOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Campo de Busca Global */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por descrição ou fornecedor..."
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
              className="pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-4"
            />
          </div>
        </div>

        {/* Tabela de Estoque */}
        {locais.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Nenhum local cadastrado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Para usar o controle de estoque, você precisa cadastrar pelo menos um local ativo.
                    Vá para a seção "Locais" e cadastre um novo local.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-2 border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border-2 border-gray-400">Fornecedor</th>
                  <th className="px-4 py-2 border-2 border-gray-400">Descrição</th>
                  {locais.map(local => (
                    <th key={local} className="px-4 py-2 border-2 border-gray-400 bg-amber-50">{local}</th>
                  ))}
                  <th className="px-4 py-2 border-2 border-gray-400">Preço</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltradosGlobal.map((produto, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border-2 border-gray-400">{produto.fornecedor}</td>
                    <td className="px-4 py-2 border-2 border-gray-400">
                      <button
                        onClick={() => navegarParaProduto(produto)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left w-full"
                        title="Clique para ver detalhes do produto"
                      >
                        {produto.descricao}
                      </button>
                    </td>
                    {locais.map(local => {
                      const estoqueLocal = produto.estoque?.[local] || { quantidade: 0, observacao: '', cor: null };
                      
                      // Definir estilos de cor baseado na cor selecionada
                      const getCorStyles = (cor) => {
                        if (!cor) return { backgroundColor: 'transparent', border: '2px solid #9ca3af' };
                        switch(cor) {
                          case 'amarelo':
                            return { backgroundColor: '#fde68a', border: '3px solid #f59e0b' };
                          case 'vermelho':
                            return { backgroundColor: '#fca5a5', border: '3px solid #ef4444' };
                          case 'laranja':
                            return { backgroundColor: '#fdba74', border: '3px solid #f97316' };
                          case 'lilas':
                            return { backgroundColor: '#c4b5fd', border: '3px solid #8b5cf6' };
                          default:
                            return { backgroundColor: 'transparent', border: '2px solid #9ca3af' };
                        }
                      };
                      
                      return (
                        <td key={local} className="px-4 py-2 text-center relative" style={getCorStyles(estoqueLocal.cor)}>
                          {/* Ícone de exclamação discreto no canto superior direito */}
                          {estoqueLocal.observacao && (
                            <button
                              onClick={() => handleQuantidadeClick(produto, local)}
                              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-xs"
                              title={estoqueLocal.observacao}
                            >
                              <FaExclamationCircle />
                            </button>
                          )}
                          
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleQuantidadeClick(produto, local)}
                              className="hover:bg-gray-100 px-2 py-1 rounded"
                            >
                              {estoqueLocal.quantidade}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 border-2 border-gray-400 text-right">
                      {(produto.tabc || produto.preco || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Lançamento */}
        <Dialog
          open={isLancamentoOpen}
          onClose={() => setIsLancamentoOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-3xl rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                Novo Lançamento
              </Dialog.Title>

              <form onSubmit={handleLancamentoSubmit}>
                {/* Primeira linha: Data, Hora, Tipo, Local */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input
                      type="date"
                      value={lancamentoData.data}
                      onChange={(e) => setLancamentoData({...lancamentoData, data: e.target.value})}
                      className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora</label>
                    <input
                      type="time"
                      value={lancamentoData.hora}
                      onChange={(e) => setLancamentoData({...lancamentoData, hora: e.target.value})}
                      className="mt-1 block w-[99px] px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={lancamentoData.tipo}
                      onChange={(e) => setLancamentoData({...lancamentoData, tipo: e.target.value})}
                      className="mt-1 block w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="Entrada">Entrada</option>
                      <option value="Saída">Saída</option>
                      <option value="Balancao">Balanço</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Local</label>
                    <select
                      value={lancamentoData.local}
                      onChange={(e) => setLancamentoData({...lancamentoData, local: e.target.value})}
                      className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um local</option>
                      {locais.map(local => (
                        <option key={local} value={local}>{local}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linha separadora */}
                <hr className="my-6 border-gray-300" />

                {/* Segunda linha: Quantidade, Descrição/SKU */}
                <div className="flex gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                      type="number"
                      value={lancamentoData.quantidade}
                      onChange={(e) => setLancamentoData({...lancamentoData, quantidade: e.target.value})}
                      className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="relative sugestoes-container flex-1">
                    <label className="block text-sm font-medium text-gray-700">Descrição/SKU</label>
                    <input
                      type="text"
                      value={lancamentoData.descricao}
                      onChange={handleDescricaoChange}
                      onBlur={() => {
                        const termo = (lancamentoData.descricao || '').toLowerCase();
                        if (!termo || termo.length < 2) {
                          setProdutoNaoCadastrado(false);
                          return;
                        }
                        const filtrados = produtosCadastrados.filter((p) =>
                          p.descricao?.toLowerCase().includes(termo) ||
                          p.sku?.toLowerCase().includes(termo) ||
                          p.fornecedor?.toLowerCase().includes(termo)
                        );
                        const existeMatchExato = produtosCadastrados.some(
                          (p) =>
                            p.descricao?.toLowerCase() === termo ||
                            p.sku?.toLowerCase() === termo
                        );
                        setProdutoNaoCadastrado(!existeMatchExato && filtrados.length === 0);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Digite para buscar produtos cadastrados..."
                      required
                    />
                    {produtoNaoCadastrado && (
                      <p className="mt-1 text-sm text-red-600">Item não cadastrado</p>
                    )}
                    
                    {/* Dropdown de sugestões */}
                    {mostrarSugestoes && produtosFiltrados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {produtosFiltrados.map((produto, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                            onClick={() => selecionarProduto(produto)}
                          >
                            <div className="font-medium text-gray-900">{produto.descricao}</div>
                            <div className="text-sm text-gray-600">
                              SKU: {produto.sku} | Fornecedor: {produto.fornecedor}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terceira linha: Fornecedor, Preço */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                    <input
                      type="text"
                      value={lancamentoData.fornecedor}
                      onChange={(e) => setLancamentoData({...lancamentoData, fornecedor: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Preço</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lancamentoData.preco}
                      onChange={(e) => setLancamentoData({...lancamentoData, preco: e.target.value})}
                      className="mt-1 block w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Quarta linha: Observação (textarea) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Observação</label>
                  <textarea
                    value={lancamentoData.observacao}
                    onChange={(e) => setLancamentoData({...lancamentoData, observacao: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    placeholder="Digite observações adicionais..."
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsLancamentoOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog
          open={isHistoricoOpen}
          onClose={() => setIsHistoricoOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-6xl h-[90vh] rounded bg-white flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <Dialog.Title className="text-lg font-medium">
                  Histórico de Lançamentos
                </Dialog.Title>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuHistoricoAberto(v => !v)}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Mais ações"
                  >
                    <FaEllipsisV />
                  </button>
                  {menuHistoricoAberto && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-10">
                      <button
                        type="button"
                        onClick={toggleSelecionarTodos}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                      >
                        {isTodosSelecionados ? 'Desmarcar todos' : 'Selecionar todos da página'}
                      </button>
                      <button
                        type="button"
                        onClick={excluirLancamentosSelecionados}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <FaTrash /> Excluir selecionados (não altera estoque)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-hidden">
                {/* Filtros */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input
                      type="date"
                      name="dataInicio"
                      value={filtrosHistorico.dataInicio}
                      onChange={handleFiltroHistorico}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                    <input
                      type="date"
                      name="dataFim"
                      value={filtrosHistorico.dataFim}
                      onChange={handleFiltroHistorico}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição/SKU</label>
                    <input
                      type="text"
                      name="descricao"
                      value={filtrosHistorico.descricao}
                      onChange={handleFiltroHistorico}
                      placeholder="Buscar por descrição..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      name="tipo"
                      value={filtrosHistorico.tipo}
                      onChange={handleFiltroHistorico}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      <option value="Entrada">Entrada</option>
                      <option value="Saída">Saída</option>
                      <option value="Saida">Saída</option>
                      <option value="Balancao">Balanço</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Local</label>
                    <select
                      name="local"
                      value={filtrosHistorico.local}
                      onChange={handleFiltroHistorico}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {locais.map(local => (
                        <option key={local} value={local}>{local}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de Histórico com scroll */}
                <div className="overflow-auto h-full border border-gray-200 rounded-lg">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <input
                            type="checkbox"
                            checked={isTodosSelecionados}
                            onChange={toggleSelecionarTodos}
                            title="Selecionar todos"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => setOrdenacaoData(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                            className="flex items-center gap-1 hover:underline"
                            title="Ordenar por Data/Hora"
                          >
                            Data/Hora
                            <span className="text-[10px]">{ordenacaoData === 'asc' ? '▲' : ordenacaoData === 'desc' ? '▼' : ''}</span>
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Local</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Descrição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Quantidade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Observação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Usuário</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historicoParaExibir.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                            Nenhum lançamento encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        historicoParaExibir.map((lancamento, index) => {
                          // 🔍 LOG ESPECÍFICO PARA DEBUG - TEMPORÁRIO
                          if (index < 5) {
                            console.log(`🔍 Renderizando linha ${index + 1}:`, {
                              id: lancamento.id,
                              descricao: lancamento.descricao,
                              tipo: lancamento.tipo,
                              quantidade: lancamento.quantidade
                            });
                          }
                          
                          return (
                          <tr key={`${lancamento.id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="checkbox"
                                checked={isSelecionado(lancamento.id)}
                                onChange={() => toggleSelecionado(lancamento.id)}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatarDataBrasileira(lancamento.data)} {lancamento.hora && `- ${lancamento.hora}`}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                lancamento.tipo === 'Entrada' ? 'bg-green-100 text-green-800' :
                                lancamento.tipo === 'Saída' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lancamento.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {lancamento.local}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <button
                                onClick={() => {
                                  // Buscar o produto correspondente no histórico
                                  const produto = produtosCadastrados.find(p => 
                                    p.descricao === lancamento.descricao || p.sku === lancamento.descricao
                                  );
                                  if (produto) {
                                    navegarParaProduto(produto);
                                    setIsHistoricoOpen(false);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                title="Clique para ver detalhes do produto"
                              >
                                {lancamento.descricao}
                              </button>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                lancamento.quantidade > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {lancamento.quantidade > 0 ? '+' : ''}{lancamento.quantidade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={lancamento.observacao}>
                              {lancamento.observacao || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {lancamento.usuario || 'Sistema'}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {historicoFiltrado.length} lançamento(s) encontrado(s)
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoricoOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Modal de Observação da Quantidade */}
        <Dialog
          open={observacaoQuantidade.isOpen}
          onClose={() => setObservacaoQuantidade({ isOpen: false, produto: null, local: null, observacao: '', cor: 'amarelo' })}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-md rounded bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                Observação da Quantidade
              </Dialog.Title>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Produto: {observacaoQuantidade.produto?.descricao}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Local: {observacaoQuantidade.local}
                </p>
                
                {/* Seleção de Cor */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor da célula:
                  </label>
                  <div className="flex gap-3">
                    {/* Opção incolor */}
                    <button
                      type="button"
                      onClick={() => setObservacaoQuantidade(prev => ({ ...prev, cor: null }))}
                      className={`w-8 h-8 rounded-full bg-white border-2 ${
                        observacaoQuantidade.cor === null 
                          ? 'border-gray-800 ring-2 ring-gray-300' 
                          : 'border-gray-300'
                      } hover:scale-110 transition-transform relative`}
                      title="Incolor"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-red-500"></div>
                      </div>
                    </button>
                    
                    {/* Opções coloridas */}
                    {[
                      { nome: 'amarelo', cor: 'bg-yellow-400', label: 'Amarelo' },
                      { nome: 'vermelho', cor: 'bg-red-400', label: 'Vermelho' },
                      { nome: 'laranja', cor: 'bg-orange-400', label: 'Laranja' },
                      { nome: 'lilas', cor: 'bg-purple-400', label: 'Lilás' }
                    ].map((opcao) => (
                      <button
                        key={opcao.nome}
                        type="button"
                        onClick={() => setObservacaoQuantidade(prev => ({ ...prev, cor: opcao.nome }))}
                        className={`w-8 h-8 rounded-full ${opcao.cor} border-2 ${
                          observacaoQuantidade.cor === opcao.nome 
                            ? 'border-gray-800 ring-2 ring-gray-300' 
                            : 'border-gray-300'
                        } hover:scale-110 transition-transform`}
                        title={opcao.label}
                      />
                    ))}
                  </div>
                </div>

                <textarea
                  value={observacaoQuantidade.observacao}
                  onChange={(e) => setObservacaoQuantidade(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Digite a observação..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setObservacaoQuantidade({ isOpen: false, produto: null, local: null, observacao: '', cor: 'amarelo' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarObservacao}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default Estoque; 