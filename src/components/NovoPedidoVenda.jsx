import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSearch, FaTrash, FaEdit, FaTimes, FaEllipsisH, FaExclamationTriangle } from 'react-icons/fa';
import CadastroCliente from './CadastroCliente';
import FormularioCliente from './FormularioCliente';
import NovoCliente from './NovoCliente';
import { pedidosVendaService, colaboradoresService } from '../services/database';

const NovoPedidoVenda = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    id: null,
    numeroPedido: '',
    situacao: 'Em aberto',
    vendedor: '',
    pedidoVinculado: false,
    tipoVinculo: '',
    numeroPedidoVinculado: '',
    observacoesVinculo: '',
    cliente: '',
    produtos: [],
    formasPagamento: [{
      tipo: '',
      parcelas: '',
      bandeira: '',
      valor: '',
      observacoes: ''
    }],
    contraEntrega: '',
    valorContraEntrega: '',
    formaPagamentoContraEntrega: '',
    obsContraEntrega: '',
    degustacaoDelivery: '',
    observacoesDegustacaoDelivery: '',
    antiManchas: '',
    valorAntiManchas: '',
    prestadorAntiManchas: '',
    localAplicacaoAntiManchas: '',
    valorFrete: '',
    retiradaAtoCompra: '',
    itensRetirados: '',
    observacoesVisiveis: '',
    observacoesInternas: '',
    dataCriacao: new Date().toISOString().split('T')[0]
  });

  const [modalObservacao, setModalObservacao] = useState({
    isOpen: false,
    produtoIndex: null,
    observacao: ''
  });

  // Estado para modal de produtos
  const [modalProduto, setModalProduto] = useState({
    isOpen: false,
    produtoIndex: null,
    produto: {
      sl: '',
      quantidade: '',
      produto: '',
      fabrica: '',
      precoLista: '',
      descontoLista: '0%',
      precoFinal: '',
      observacoes: '',
      produtoId: null,
      sku: ''
    }
  });

  // Estado para menu dropdown dos 3 pontinhos
  const [menuAcoes, setMenuAcoes] = useState({
    isOpen: false,
    produtoIndex: null
  });

  // Debug: log do estado do menu
  console.log('Estado atual do menuAcoes:', menuAcoes);

  const [showFormularioCliente, setShowFormularioCliente] = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [mostrarSugestoesCliente, setMostrarSugestoesCliente] = useState(false);

  // Estados para produtos cadastrados
  const [produtosCadastrados, setProdutosCadastrados] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [mostrarSugestoesProduto, setMostrarSugestoesProduto] = useState(false);
  const [produtoIndexAtual, setProdutoIndexAtual] = useState(null);

  // Estados para fornecedores (sugestões no campo Fábrica)
  const [fornecedoresCadastrados, setFornecedoresCadastrados] = useState([]);
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [mostrarSugestoesFornecedor, setMostrarSugestoesFornecedor] = useState(false);
  const [fornecedorIndexAtual, setFornecedorIndexAtual] = useState(null);

  // Estados para vendedores ativos
  const [vendedoresAtivos, setVendedoresAtivos] = useState([]);
  const [buscaVendedor, setBuscaVendedor] = useState('');
  const [mostrarSugestoesVendedor, setMostrarSugestoesVendedor] = useState(false);

  // Estados para locais ativos
  const [locaisAtivos, setLocaisAtivos] = useState([]);

  // Estado para desconto total da venda
  const [descontoVenda, setDescontoVenda] = useState('');

  // Carregar o próximo número de pedido
  useEffect(() => {
    const carregarProximoNumero = async () => {
      try {
        const pedidos = await pedidosVendaService.buscarTodos();
        const ultimoPedido = pedidos.reduce((maior, pedido) => {
          const numeroAtual = parseInt(pedido.numeroPedido);
          return numeroAtual > maior ? numeroAtual : maior;
        }, 0);
        
        const proximoNumero = (ultimoPedido + 1).toString().padStart(5, '0');
        setFormData(prev => ({
          ...prev,
          numeroPedido: proximoNumero,
          id: Date.now() // ID único para controle interno
        }));
      } catch (error) {
        console.error('Erro ao carregar próximo número:', error);
        // Fallback para número padrão
        setFormData(prev => ({
          ...prev,
          numeroPedido: '00001',
          id: Date.now()
        }));
      }
    };

    if (!id) {
      carregarProximoNumero();
    } else {
      // Carregar dados do pedido existente
      const carregarPedidoExistente = async () => {
        try {
          const pedidoExistente = await pedidosVendaService.buscarPorId(id);
          if (pedidoExistente) {
            // Garantir que todas as formas de pagamento tenham o campo valor
            const pedidoComValor = {
              ...pedidoExistente,
              formasPagamento: pedidoExistente.formasPagamento?.map(forma => ({
                ...forma,
                valor: forma.valor || ''
              })) || [{
                tipo: '',
                parcelas: '',
                bandeira: '',
                valor: '',
                observacoes: ''
              }]
            };
            setFormData(pedidoComValor);
            // Preencher clienteSelecionado se houver dados do cliente
            if (pedidoExistente.clienteId || pedidoExistente.cliente) {
              setClienteSelecionado({
                id: pedidoExistente.clienteId || '',
                nome: pedidoExistente.cliente || '',
                cpfCnpj: pedidoExistente.clienteCpfCnpj || '',
                email: pedidoExistente.clienteEmail || '',
                telefone1: pedidoExistente.clienteTelefone || ''
              });
            }
            // Preencher descontoVenda se houver
            if (pedidoExistente.descontoVenda !== undefined) {
              setDescontoVenda(pedidoExistente.descontoVenda);
            }
          } else {
            navigate('/pedidos-venda');
          }
        } catch (error) {
          console.error('Erro ao carregar pedido:', error);
          navigate('/pedidos-venda');
        }
      };
      carregarPedidoExistente();
    }
  }, [id, navigate]);

  // Verificar se há dados de orçamento para converter
  useEffect(() => {
    if (!id) {
      const dadosOrcamento = localStorage.getItem('orcamentoParaPedido');
      if (dadosOrcamento) {
        try {
          const orcamentoData = JSON.parse(dadosOrcamento);
          
          // Preencher o formulário com os dados do orçamento
          setFormData(prev => ({
            ...prev,
            cliente: orcamentoData.cliente || '',
            vendedor: orcamentoData.vendedor || '',
            produtos: orcamentoData.produtos || [],
            formasPagamento: orcamentoData.formasPagamento || [{
              tipo: '',
              parcelas: '',
              bandeira: '',
              valor: '',
              observacoes: ''
            }],
            observacoes: orcamentoData.observacoes || '',
            observacoesInternas: orcamentoData.observacoesInternas || ''
          }));

          // Preencher cliente selecionado
          if (orcamentoData.cliente) {
            setClienteSelecionado({
              nome: orcamentoData.cliente,
              telefone1: orcamentoData.telefone || ''
            });
          }

          // Limpar os dados do localStorage após usar
          localStorage.removeItem('orcamentoParaPedido');
        } catch (error) {
          console.error('Erro ao processar dados do orçamento:', error);
          localStorage.removeItem('orcamentoParaPedido');
        }
      }
    }
  }, [id]);

  // Carregar produtos cadastrados
  useEffect(() => {
    const carregarProdutos = () => {
      try {
        const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
        setProdutosCadastrados(produtos);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProdutosCadastrados([]);
      }
    };

    carregarProdutos();
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarProdutos, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carregar fornecedores cadastrados
  useEffect(() => {
    const carregarFornecedores = () => {
      try {
        const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
        const fornecedoresAtivos = fornecedores.filter(f => f.status === 'Ativo');
        setFornecedoresCadastrados(fornecedoresAtivos);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        setFornecedoresCadastrados([]);
      }
    };

    carregarFornecedores();
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarFornecedores, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carregar vendedores ativos
  useEffect(() => {
    const carregarVendedoresAtivos = async () => {
      try {
        const colaboradores = await colaboradoresService.buscarTodos();
        // Filtrar apenas colaboradores ativos com cargos de vendedor
        const vendedores = colaboradores.filter(colaborador =>
          colaborador.status === 'Ativo' &&
          (colaborador.cargo?.toLowerCase().includes('vendedor') ||
           colaborador.cargo?.toLowerCase().includes('gerente') ||
           colaborador.cargo?.toLowerCase().includes('comercial'))
        );
        setVendedoresAtivos(vendedores);
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
        setVendedoresAtivos([]);
      }
    };

    carregarVendedoresAtivos();
    // Recarregar a cada 10 segundos para sincronização
    const interval = setInterval(carregarVendedoresAtivos, 10000);
    return () => clearInterval(interval);
  }, []);

  // Verificar se voltou do cadastro de cliente - com verificação contínua
  useEffect(() => {
    const verificarRetornoCliente = () => {
      const dadosRetorno = localStorage.getItem('pedidoTempParaRetorno');
      const clienteCriado = localStorage.getItem('clienteRecemCriado');
      const clienteEditado = localStorage.getItem('clienteEditado');
      
      if (dadosRetorno) {
        try {
          const dadosSalvos = JSON.parse(dadosRetorno);
          
          // Restaurar dados do pedido
          setFormData(dadosSalvos.formData);
          setDescontoVenda(dadosSalvos.descontoVenda || '');
          
          if (clienteCriado || clienteEditado) {
            // Cliente foi salvo - usar o cliente novo/editado
            const cliente = clienteCriado ? JSON.parse(clienteCriado) : JSON.parse(clienteEditado);
            const isNovoCliente = !!clienteCriado;
            setClienteSelecionado(cliente);
            
            // Mostrar confirmação
            const mensagem = isNovoCliente 
              ? '✅ Cliente criado com sucesso e selecionado no pedido!'
              : '✅ Cliente editado com sucesso e atualizado no pedido!';
            alert(mensagem);
          } else {
            // Voltou sem salvar - restaurar cliente original
            setClienteSelecionado(dadosSalvos.clienteSelecionado);
          }
          
          // Limpar dados temporários
          localStorage.removeItem('pedidoTempParaRetorno');
          localStorage.removeItem('clienteRecemCriado');
          localStorage.removeItem('clienteEditado');
        } catch (error) {
          console.error('Erro ao restaurar dados do pedido:', error);
          localStorage.removeItem('pedidoTempParaRetorno');
          localStorage.removeItem('clienteRecemCriado');
          localStorage.removeItem('clienteEditado');
        }
      }
    };

    // Verificar na montagem
    verificarRetornoCliente();

    // Verificar quando a janela ganha foco (útil quando volta de outra aba)
    const handleFocus = () => verificarRetornoCliente();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Carregar clientes do banco de dados
  useEffect(() => {
    const carregarClientes = () => {
      try {
        // Carregar clientes do localStorage (compatibilidade com NovoCliente e CadastroCliente)
        const clientesSalvos = localStorage.getItem('clientes');
        console.log('Clientes salvos no localStorage:', clientesSalvos);
        if (clientesSalvos) {
          const clientesData = JSON.parse(clientesSalvos);
          console.log('Clientes carregados:', clientesData);
          setClientes(clientesData);
        } else {
          console.log('Nenhum cliente encontrado no localStorage');
          setClientes([]);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
      }
    };

    carregarClientes();
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarClientes, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carregar locais ativos
  useEffect(() => {
    const carregarLocaisAtivos = () => {
      try {
        const locais = JSON.parse(localStorage.getItem('locais') || '[]');
        // Filtrar apenas locais ativos
        const locaisAtivos = locais.filter(local => local.status === 'Ativo');
        setLocaisAtivos(locaisAtivos);
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
        setLocaisAtivos([]);
      }
    };

    carregarLocaisAtivos();
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarLocaisAtivos, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verificar se o clique foi fora dos elementos que devem fechar
      if (!event.target.closest('.relative')) {
        setMostrarSugestoesProduto(false);
        setProdutoIndexAtual(null);
        setMostrarSugestoesVendedor(false);
        setMostrarSugestoesCliente(false);
        setMostrarSugestoesFornecedor(false);
        setFornecedorIndexAtual(null);
        // Fechar o menu de ações quando clicar fora
        setMenuAcoes({ isOpen: false, produtoIndex: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar produtos para sugestões
  const produtosFiltrados = produtosCadastrados.filter(produto => {
    const matchBusca = produto.sku?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      produto.fornecedor?.toLowerCase().includes(buscaProduto.toLowerCase());
    
    // Se não há busca, não mostrar nada
    if (!buscaProduto) return false;
    
    // Se há SL selecionado no modal, verificar se o produto tem estoque naquele local
    if (modalProduto.isOpen && modalProduto.produto.sl && modalProduto.produto.sl !== 'SE') {
      const estoqueLocal = produto.estoque?.[modalProduto.produto.sl];
      const temEstoque = estoqueLocal && estoqueLocal.quantidade > 0;
      return matchBusca && temEstoque;
    }
    
    // Se não há SL selecionado ou é SE (Sob Encomenda), mostrar todos os produtos
    return matchBusca;
  });

  // Filtrar vendedores para sugestões
  const vendedoresFiltrados = vendedoresAtivos.filter(vendedor =>
    vendedor.nome?.toLowerCase().includes(buscaVendedor.toLowerCase()) ||
    vendedor.cargo?.toLowerCase().includes(buscaVendedor.toLowerCase())
  );

  // Filtrar clientes para sugestões (nome, CPF/CNPJ, telefone)
  const clientesFiltrados = clientes.filter(cliente => {
    const match = cliente.nome?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
      cliente.cpfCnpj?.includes(buscaCliente) ||
      cliente.telefone1?.includes(buscaCliente) ||
      cliente.telefone2?.includes(buscaCliente);
    
    if (buscaCliente) {
      console.log('Buscando:', buscaCliente, 'Cliente:', cliente.nome, 'Match:', match);
    }
    
    return match;
  });

  // Filtrar fornecedores para sugestões
  const fornecedoresFiltrados = fornecedoresCadastrados.filter(fornecedor => {
    const match = fornecedor.nomeFantasia?.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
      fornecedor.razaoSocial?.toLowerCase().includes(buscaFornecedor.toLowerCase()) ||
      fornecedor.cnpj?.includes(buscaFornecedor);
    
    return match;
  });

  // Função para selecionar cliente
  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente('');
    setMostrarSugestoesCliente(false);
  };

  // Função para selecionar produto cadastrado
  const selecionarProdutoCadastrado = (produto, index) => {
    const newProdutos = [...formData.produtos];
    const precoFormatado = produto.tabc ? Number(produto.tabc).toFixed(2) : '';
    newProdutos[index] = {
      ...newProdutos[index],
      produto: produto.descricao,
      fabrica: produto.fornecedor,
      produtoId: produto.id,
      sku: produto.sku,
      precoLista: precoFormatado,
                                        descontoLista: '0%', // Desconto padrão
      precoFinal: precoFormatado
    };

    setFormData(prev => ({ ...prev, produtos: newProdutos }));
    setBuscaProduto('');
    setMostrarSugestoesProduto(false);
    setProdutoIndexAtual(null);
  };

  // Função para selecionar vendedor
  const selecionarVendedor = (vendedor) => {
    setFormData(prev => ({ ...prev, vendedor: vendedor.nome }));
    setBuscaVendedor('');
    setMostrarSugestoesVendedor(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProdutoChange = (index, field, value) => {
    const newProdutos = [...formData.produtos];
    newProdutos[index] = {
      ...newProdutos[index],
      [field]: value
    };

    // Calcular preço final quando preço ou desconto mudar
    if (field === 'precoLista' || field === 'descontoLista') {
      newProdutos[index].precoFinal = calcularPrecoFinal(
        field === 'precoLista' ? value : newProdutos[index].precoLista,
        field === 'descontoLista' ? value : newProdutos[index].descontoLista
      );
    }

    setFormData(prev => ({ ...prev, produtos: newProdutos }));
  };

  const addProduto = () => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, {
        sl: '',
        quantidade: '',
        produto: '',
        fabrica: '',
        precoLista: '',
        descontoLista: '',
        precoFinal: '',
        observacoes: '',
        produtoId: null,
        sku: ''
      }]
    }));
  };

  const removeProduto = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const addFormaPagamento = () => {
    setFormData(prev => ({
      ...prev,
      formasPagamento: [...prev.formasPagamento, {
        tipo: '',
        parcelas: '',
        bandeira: '',
        valor: '',
        observacoes: ''
      }]
    }));
  };

  const removeFormaPagamento = (index) => {
    setFormData(prev => ({
      ...prev,
      formasPagamento: prev.formasPagamento.filter((_, i) => i !== index)
    }));
  };

  // Função para processar desconto (reais ou porcentagem)
  const processarDesconto = (valorDesconto) => {
    if (!valorDesconto || valorDesconto === '') return { valor: 0, tipo: 'porcentagem' };
    
    const valorLimpo = valorDesconto.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const temPorcentagem = valorDesconto.toString().includes('%');
    
    if (temPorcentagem) {
      // Desconto em porcentagem
      return { valor: parseFloat(valorLimpo) || 0, tipo: 'porcentagem' };
    } else {
      // Desconto em reais
      return { valor: parseFloat(valorLimpo) || 0, tipo: 'reais' };
    }
  };

  const calcularPrecoFinal = (precoLista, descontoLista) => {
    console.log('Calculando preço final:', { precoLista, descontoLista });
    
    if (!precoLista || precoLista === '' || !descontoLista || descontoLista === '') {
      console.log('Valores inválidos, retornando 0');
      return 0;
    }
    
    const descontoProcessado = processarDesconto(descontoLista);
    console.log('Desconto processado:', descontoProcessado);
    
    let desconto;
    
    if (descontoProcessado.tipo === 'porcentagem') {
      desconto = (precoLista * descontoProcessado.valor) / 100;
    } else {
      desconto = descontoProcessado.valor;
    }
    
    const precoFinal = (precoLista - desconto).toFixed(2);
    console.log('Preço final calculado:', precoFinal);
    
    return precoFinal;
  };

  const calcularTotais = () => {
    console.log('Calculando totais para produtos:', formData.produtos);
    
    const totais = formData.produtos.reduce((acc, produto) => {
      const quantidade = Number(produto.quantidade) || 1;
      const precoFinalUnit = calcularPrecoFinal(produto.precoLista, produto.descontoLista);
      const descontoProcessado = processarDesconto(produto.descontoLista);
      let valorDescontoUnit;
      
      if (descontoProcessado.tipo === 'porcentagem') {
        valorDescontoUnit = produto.precoLista && produto.precoLista !== '' ? (Number(produto.precoLista) * descontoProcessado.valor) / 100 : 0;
      } else {
        valorDescontoUnit = descontoProcessado.valor;
      }
      
      // Usar a nova função para calcular o valor total do item
      const valorItem = calcularPrecoTotalItem(quantidade, precoFinalUnit);
      const valorTotalItem = produto.precoLista && produto.precoLista !== '' ? (Number(produto.precoLista) * quantidade || 0) : 0;
      console.log(`Produto: ${produto.produto}, Quantidade: ${quantidade}, Preço Final Unit: ${precoFinalUnit}, Valor Item: ${valorItem}`);
      
      return {
        valorTotal: acc.valorTotal + valorTotalItem,
        desconto: acc.desconto + (valorDescontoUnit * quantidade || 0),
        valorFinal: acc.valorFinal + Number(valorItem)
      };
    }, { valorTotal: 0, desconto: 0, valorFinal: 0 });

    // Desconto extra na venda
    let descontoExtra = 0;
    let valorFinalComExtra = totais.valorFinal;
    if (descontoVenda && descontoVenda !== '') {
      const valor = descontoVenda.toString().replace(',', '.').replace('%', '').trim();
      if (descontoVenda.toString().includes('%')) {
        descontoExtra = (Number(valor) / 100) * totais.valorFinal;
      } else {
        descontoExtra = Number(valor);
      }
      valorFinalComExtra = totais.valorFinal - descontoExtra;
      if (valorFinalComExtra < 0) valorFinalComExtra = 0;
    }

    // Desconto total = desconto dos itens + desconto extra
    const descontoTotal = totais.desconto + descontoExtra;

    return {
      valorTotal: isNaN(totais.valorTotal) ? '0.00' : totais.valorTotal.toFixed(2),
      desconto: isNaN(descontoTotal) ? '0.00' : descontoTotal.toFixed(2),
      valorFinal: isNaN(valorFinalComExtra) ? '0.00' : valorFinalComExtra.toFixed(2)
    };
  };

  const abrirModalObservacao = (index, observacao) => {
    setModalObservacao({
      isOpen: true,
      produtoIndex: index,
      observacao: observacao || ''
    });
  };

  const fecharModalObservacao = () => {
    setModalObservacao({
      isOpen: false,
      produtoIndex: null,
      observacao: ''
    });
  };

  const salvarObservacao = () => {
    const newProdutos = [...formData.produtos];
    newProdutos[modalObservacao.produtoIndex] = {
      ...newProdutos[modalObservacao.produtoIndex],
      observacoes: modalObservacao.observacao
    };
    setFormData(prev => ({ ...prev, produtos: newProdutos }));
    fecharModalObservacao();
  };

  // Funções para modal de produtos
  const abrirModalProduto = (index = null) => {
    if (index !== null) {
      // Editando produto existente
      setModalProduto({
        isOpen: true,
        produtoIndex: index,
        produto: { ...formData.produtos[index] }
      });
    } else {
      // Novo produto
      setModalProduto({
        isOpen: true,
        produtoIndex: null,
        produto: {
          sl: '',
          quantidade: '',
          produto: '',
          fabrica: '',
          precoLista: '',
          descontoLista: '0%',
          precoFinal: '',
          observacoes: '',
          produtoId: null,
          sku: ''
        }
      });
    }
  };

  const fecharModalProduto = () => {
    setModalProduto({
      isOpen: false,
      produtoIndex: null,
      produto: {
        sl: '',
        quantidade: '',
        produto: '',
        fabrica: '',
        precoLista: '',
        descontoLista: '',
        precoFinal: '',
        observacoes: '',
        produtoId: null,
        sku: ''
      }
    });
  };

  const salvarProduto = () => {
    // Validar campos obrigatórios no modal de produto
    const { sl, quantidade, produto } = modalProduto.produto || {};
    const quantidadeNumObrigatoria = parseInt(quantidade);
    if (!sl || String(sl).trim() === '') {
      alert('Por favor, selecione o local do produto.');
      return;
    }
    if (!quantidade || isNaN(quantidadeNumObrigatoria) || quantidadeNumObrigatoria <= 0) {
      alert('Por favor, informe uma quantidade maior que zero.');
      return;
    }
    if (!produto || String(produto).trim() === '') {
      alert('Por favor, informe a descrição do produto.');
      return;
    }

    // Validar estoque antes de salvar
    if (modalProduto.produto.sl && modalProduto.produto.sl !== 'SE' && modalProduto.produto.produtoId) {
      const produtoCadastrado = produtosCadastrados.find(p => p.id === modalProduto.produto.produtoId);
      if (produtoCadastrado) {
        const estoqueDisponivel = produtoCadastrado.estoque?.[modalProduto.produto.sl]?.quantidade || 0;
        const quantidadeSolicitada = parseInt(modalProduto.produto.quantidade) || 0;
        
        if (quantidadeSolicitada > estoqueDisponivel) {
          alert(`❌ Não é possível vender ${quantidadeSolicitada} unidades. Estoque disponível em ${modalProduto.produto.sl}: ${estoqueDisponivel} unidades.`);
          return;
        }
      }
    }

    const produtoEditado = {
      ...modalProduto.produto,
      precoFinal: calcularPrecoFinal(modalProduto.produto.precoLista, modalProduto.produto.descontoLista)
    };

    if (modalProduto.produtoIndex !== null) {
      // Atualizar produto existente
      const newProdutos = [...formData.produtos];
      newProdutos[modalProduto.produtoIndex] = produtoEditado;
      setFormData(prev => ({ ...prev, produtos: newProdutos }));
    } else {
      // Adicionar novo produto
      setFormData(prev => ({
        ...prev,
        produtos: [...prev.produtos, produtoEditado]
      }));
    }
    fecharModalProduto();
  };

  // Funções para menu de ações
  const abrirMenuAcoes = (index) => {
    console.log('Abrindo menu para produto:', index);
    setMenuAcoes({
      isOpen: true,
      produtoIndex: index
    });
  };

  const fecharMenuAcoes = () => {
    console.log('Fechando menu');
    setMenuAcoes({
      isOpen: false,
      produtoIndex: null
    });
  };

  const editarProduto = (index) => {
    fecharMenuAcoes();
    abrirModalProduto(index);
  };

  const excluirProduto = (index) => {
    fecharMenuAcoes();
    removeProduto(index);
  };

  const formatarValor = (valor) => {
    if (!valor) return '0,00';
    return Number(valor).toFixed(2).replace('.', ',');
  };

  // Função para calcular o preço total do item (quantidade x preço final)
  const calcularPrecoTotalItem = (quantidade, precoFinal) => {
    const qtd = parseInt(quantidade) || 0;
    const preco = parseFloat(precoFinal) || 0;
    return (qtd * preco).toFixed(2);
  };

  const handleNovoCliente = () => {
    // Verificar se já há cliente selecionado
    if (clienteSelecionado) {
      const confirmacao = window.confirm(
        'Você perderá as informações salvas do cliente. Deseja continuar?'
      );
      
      if (!confirmacao) {
        return; // Cancela a ação se o usuário escolher "Não"
      }
    }
    
    // Determinar a URL de retorno correta
    const urlRetorno = id ? `/pedidos-venda/editar/${id}` : '/pedidos-venda/novo';
    
    // Salvar dados do pedido temporariamente para retornar depois
    localStorage.setItem('pedidoTempParaRetorno', JSON.stringify({
      formData,
      clienteSelecionado,
      descontoVenda,
      origem: 'novoPedidoVenda',
      urlRetorno
    }));
    navigate('/cadastro-cliente/novo?origem=pedido');
  };

  const handleClienteSalvo = (novoCliente) => {
    setClientes(prev => [...prev, novoCliente]);
    setClienteSelecionado(novoCliente);
    setShowFormularioCliente(false);
    setBuscaCliente('');
  };

  const handleEditarCliente = (cliente) => {
    // Determinar a URL de retorno correta
    const urlRetorno = id ? `/pedidos-venda/editar/${id}` : '/pedidos-venda/novo';
    
    // Salvar dados do pedido temporariamente para retornar depois
    localStorage.setItem('pedidoTempParaRetorno', JSON.stringify({
      formData,
      clienteSelecionado,
      descontoVenda,
      origem: 'novoPedidoVenda',
      urlRetorno
    }));
    
    navigate(`/cadastro-cliente/editar/${cliente.id}?origem=pedido`);
  };

  // Função para dar baixa no estoque quando pedido for finalizado
  const darBaixaEstoque = async (produtos, isEdicao = false, produtosAnteriores = []) => {
    try {
      console.log('🚀 === INÍCIO darBaixaEstoque ===');
      console.log(`📋 Produtos recebidos: ${produtos.length}`);
      console.log('📋 Lista completa de produtos:', produtos);
      produtos.forEach((produto, index) => {
        console.log(`📦 Produto ${index + 1}: ${produto.produto} | SL: ${produto.sl} | ID: ${produto.produtoId} | Qtd: ${produto.quantidade}`);
      });
      
      // Carregar produtos cadastrados atualizados
      const produtosCadastrados = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
      const produtosAtualizados = [...produtosCadastrados];
      
      // Array para armazenar as baixas realizadas
      const baixasRealizadas = [];
      
      // Se é uma edição, calcular diferenças
      if (isEdicao && produtosAnteriores.length > 0) {
        console.log('🔄 Processando edição - calculando diferenças...');
        
        // Criar mapas para facilitar comparação
        const produtosAtuaisMap = new Map();
        const produtosAnterioresMap = new Map();
        
        // Mapear produtos atuais
        produtos.forEach(produto => {
          const key = `${produto.produtoId}-${produto.sl}`;
          produtosAtuaisMap.set(key, produto);
        });
        
        // Mapear produtos anteriores
        produtosAnteriores.forEach(produto => {
          const key = `${produto.produtoId}-${produto.sl}`;
          produtosAnterioresMap.set(key, produto);
        });
        
        // Processar cada produto atual
        for (const [key, produtoAtual] of produtosAtuaisMap) {
          const produtoAnterior = produtosAnterioresMap.get(key);
          const quantidadeAtual = parseInt(produtoAtual.quantidade) || 0;
          const quantidadeAnterior = produtoAnterior ? (parseInt(produtoAnterior.quantidade) || 0) : 0;
          
          // Calcular diferença (pode ser positiva ou negativa)
          const diferenca = quantidadeAtual - quantidadeAnterior;
          
          if (diferenca !== 0 && produtoAtual.sl !== 'SE') {
            console.log(`📊 Diferença encontrada: ${produtoAtual.produto} - ${diferenca} unidades`);
            
            // Encontrar o produto cadastrado
            const produtoCadastrado = produtosAtualizados.find(p => p.id === produtoAtual.produtoId);
            
            if (produtoCadastrado && produtoAtual.sl) {
              const estoqueAtual = produtoCadastrado.estoque?.[produtoAtual.sl]?.quantidade || 0;
              const novaQuantidade = Math.max(0, estoqueAtual - diferenca);
              
              // Atualizar estoque
              if (!produtoCadastrado.estoque) {
                produtoCadastrado.estoque = {};
              }
              
              produtoCadastrado.estoque[produtoAtual.sl] = {
                quantidade: novaQuantidade,
                observacao: produtoCadastrado.estoque[produtoAtual.sl]?.observacao || ''
              };
              
              // Calcular estoque total
              const estoqueTotal = Object.values(produtoCadastrado.estoque).reduce((total, local) => {
                return total + (local.quantidade || 0);
              }, 0);
              
              produtoCadastrado.estoqueDisponivel = estoqueTotal;
              produtoCadastrado.estoqueFisico = estoqueTotal;
              
              baixasRealizadas.push({
                produto: produtoAtual.produto,
                local: produtoAtual.sl,
                quantidadeVendida: Math.abs(diferenca),
                tipo: diferenca > 0 ? 'Adicional' : 'Reversão',
                estoqueAnterior: estoqueAtual,
                estoqueAtual: novaQuantidade
              });
            }
          }
        }
        
        // Processar produtos removidos (que estavam na versão anterior mas não na atual)
        for (const [key, produtoAnterior] of produtosAnterioresMap) {
          if (!produtosAtuaisMap.has(key) && produtoAnterior.sl !== 'SE') {
            console.log(`🗑️ Produto removido: ${produtoAnterior.produto}`);
            
            const produtoCadastrado = produtosAtualizados.find(p => p.id === produtoAnterior.produtoId);
            
            if (produtoCadastrado && produtoAnterior.sl) {
              const quantidadeRemovida = parseInt(produtoAnterior.quantidade) || 0;
              const estoqueAtual = produtoCadastrado.estoque?.[produtoAnterior.sl]?.quantidade || 0;
              const novaQuantidade = estoqueAtual + quantidadeRemovida; // Reverter a baixa
              
              if (!produtoCadastrado.estoque) {
                produtoCadastrado.estoque = {};
              }
              
              produtoCadastrado.estoque[produtoAnterior.sl] = {
                quantidade: novaQuantidade,
                observacao: produtoCadastrado.estoque[produtoAnterior.sl]?.observacao || ''
              };
              
              const estoqueTotal = Object.values(produtoCadastrado.estoque).reduce((total, local) => {
                return total + (local.quantidade || 0);
              }, 0);
              
              produtoCadastrado.estoqueDisponivel = estoqueTotal;
              produtoCadastrado.estoqueFisico = estoqueTotal;
              
              baixasRealizadas.push({
                produto: produtoAnterior.produto,
                local: produtoAnterior.sl,
                quantidadeVendida: quantidadeRemovida,
                tipo: 'Reversão (produto removido)',
                estoqueAnterior: estoqueAtual,
                estoqueAtual: novaQuantidade
              });
            }
          }
        }
      } else {
        // Processamento normal (primeira vez)
        console.log('🆕 Processando pedido novo...');
        
        for (const produtoPedido of produtos) {
          console.log(`🔍 Processando produto: ${produtoPedido.produto} (ID: ${produtoPedido.produtoId}, SL: ${produtoPedido.sl})`);
          
          // Pular produtos "SE" (sob encomenda)
          if (produtoPedido.sl === 'SE') {
            console.log(`⏭️ Pulando produto SE: ${produtoPedido.produto}`);
            continue;
          }
          
          // Encontrar o produto cadastrado correspondente
          let produtoCadastrado = produtosAtualizados.find(p => p.id === produtoPedido.produtoId);
          
          // Se não encontrou por ID, tentar encontrar por nome do produto
          if (!produtoCadastrado && produtoPedido.produto) {
            produtoCadastrado = produtosAtualizados.find(p => 
              p.descricao === produtoPedido.produto || 
              p.descricao.includes(produtoPedido.produto) ||
              produtoPedido.produto.includes(p.descricao)
            );
            console.log(`🔄 Tentativa de busca por nome: ${produtoCadastrado ? 'SUCESSO' : 'FALHOU'}`);
          }
          
          console.log(`🔎 Produto cadastrado encontrado: ${produtoCadastrado ? 'SIM' : 'NÃO'} para ID: ${produtoPedido.produtoId}`);
          console.log(`📍 Local (sl): "${produtoPedido.sl}"`);
          
          if (produtoCadastrado && produtoPedido.sl && produtoPedido.sl !== '') {
            const quantidadeVendida = parseInt(produtoPedido.quantidade) || 0;
            const estoqueAtual = produtoCadastrado.estoque?.[produtoPedido.sl]?.quantidade || 0;
            
            // Calcular nova quantidade
            const novaQuantidade = Math.max(0, estoqueAtual - quantidadeVendida);
            
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
            
            // Registrar a baixa realizada
            baixasRealizadas.push({
              produto: produtoPedido.produto,
              local: produtoPedido.sl,
              quantidadeVendida,
              tipo: 'Nova venda',
              estoqueAnterior: estoqueAtual,
              estoqueAtual: novaQuantidade
            });
            
            console.log(`✅ Baixa realizada: ${produtoPedido.produto} - ${quantidadeVendida} unidades de ${produtoPedido.sl}`);
          } else {
            console.error(`❌ PRODUTO PULADO: ${produtoPedido.produto}`);
            console.error(`   - Produto cadastrado: ${produtoCadastrado ? 'Encontrado' : 'NÃO ENCONTRADO'}`);
            console.error(`   - Local (sl): "${produtoPedido.sl}" (vazio: ${!produtoPedido.sl})`);
            console.error(`   - ID do produto: "${produtoPedido.produtoId}" (vazio: ${!produtoPedido.produtoId})`);
            console.error(`   - ESTE PRODUTO NÃO SERÁ PROCESSADO - PROBLEMA AQUI!`);
            
            // FORÇAR processamento mesmo sem encontrar o produto cadastrado
            if (produtoPedido.sl && produtoPedido.sl !== '' && produtoPedido.sl !== 'SE') {
              console.warn(`🚨 FORÇANDO processamento do produto: ${produtoPedido.produto}`);
              
              // Registrar baixa mesmo sem produto cadastrado
              baixasRealizadas.push({
                produto: produtoPedido.produto,
                local: produtoPedido.sl,
                quantidadeVendida: parseInt(produtoPedido.quantidade) || 0,
                tipo: 'Nova venda (forçada)',
                estoqueAnterior: 0,
                estoqueAtual: 0
              });
              
              console.warn(`✅ Baixa forçada registrada: ${produtoPedido.produto}`);
            }
          }
        }
      }
      
      // Salvar produtos atualizados no localStorage
      localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
      
      console.log('🔍 === DEBUG BAIXAS REALIZADAS ===');
      console.log('📊 Total de baixas realizadas:', baixasRealizadas.length);
      console.log('📋 Conteúdo completo do array baixasRealizadas:');
      baixasRealizadas.forEach((baixa, index) => {
        console.log(`  ${index + 1}. ${baixa.produto} - ${baixa.quantidadeVendida} unidades de ${baixa.local}`);
      });
      console.log('🏁 === FIM DEBUG BAIXAS ===');
      
      if (baixasRealizadas.length === 0) {
        console.warn('⚠️ ATENÇÃO: Nenhuma baixa foi realizada!');
        console.warn('📋 Produtos recebidos:', produtos);
        console.warn('🔍 Produtos cadastrados encontrados:', produtosAtualizados.length);
        // Se for uma edição sem alteração de quantidade/local, considerar sucesso silencioso
        if (isEdicao) {
          console.log('ℹ️ Edição sem alterações de estoque. Considerando sucesso.');
          return true;
        }
        return false;
      }
      
      // Criar lançamento no histórico de estoque
      const historicoExistente = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
      const obterDataHoraLocal = () => {
        const agora = new Date();
        const yyyy = String(agora.getFullYear());
        const mm = String(agora.getMonth() + 1).padStart(2, '0');
        const dd = String(agora.getDate()).padStart(2, '0');
        const data = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD em horário local
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { data, hora };
      };
      const { data: dataAtual, hora: horaAtual } = obterDataHoraLocal();
      
      // Criar lançamentos de saída para cada produto
      console.log(`📝 Criando lançamentos para ${baixasRealizadas.length} baixas...`);
      console.log('🔍 Baixas realizadas:', baixasRealizadas);
      
      const novosLancamentos = baixasRealizadas.map((baixa, index) => {
        const lancamento = {
          id: Date.now() + Math.random() + index,
          data: dataAtual,
          hora: horaAtual,
          tipo: baixa.tipo.includes('Reversão') ? 'Entrada' : 'Saída',
          fornecedor: 'Venda',
          descricao: baixa.produto,
          quantidade: baixa.tipo.includes('Reversão') ? baixa.quantidadeVendida : -baixa.quantidadeVendida,
          observacao: `${baixa.tipo} - Pedido ${formData.numeroPedido}`,
          usuario: 'Sistema',
          local: baixa.local
        };
        console.log(`📝 Lançamento ${index + 1} criado:`, lancamento);
        return lancamento;
      });
      
      console.log(`📝 Total de lançamentos a serem salvos: ${novosLancamentos.length}`);
      
      // 🔍 LOG ESPECÍFICO PARA DEBUG - TEMPORÁRIO
      console.log('🔍 === DEBUG LANÇAMENTOS ANTES DE SALVAR ===');
      novosLancamentos.forEach((lanc, i) => {
        console.log(`🔍 Lançamento ${i + 1}:`, {
          id: lanc.id,
          descricao: lanc.descricao,
          quantidade: lanc.quantidade,
          tipo: lanc.tipo,
          local: lanc.local,
          observacao: lanc.observacao
        });
      });
      console.log('🔍 === FIM DEBUG ===');
      
      // Adicionar novos lançamentos ao histórico
      const novoHistorico = [...historicoExistente, ...novosLancamentos];
      localStorage.setItem('historicoLancamentos', JSON.stringify(novoHistorico));
      
      // DELAY para garantir que o localStorage seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`💾 Histórico salvo. Total de lançamentos: ${novoHistorico.length}`);
      
      // Verificar se foi salvo corretamente
      const historicoVerificado = JSON.parse(localStorage.getItem('historicoLancamentos') || '[]');
      console.log(`🔍 Verificação: histórico no localStorage tem ${historicoVerificado.length} lançamentos`);
      console.log('🔍 Últimos lançamentos salvos:', historicoVerificado.slice(-novosLancamentos.length));
      
      console.log('✅ Baixa no estoque realizada com sucesso:', baixasRealizadas);
      console.log(`📊 Total de baixas realizadas: ${baixasRealizadas.length}`);
      console.log(`📝 Total de lançamentos criados: ${novosLancamentos.length}`);
      console.log('🏁 === FIM darBaixaEstoque ===');
      
      // Mostrar resumo das baixas
      if (baixasRealizadas.length > 0) {
        console.log('📋 Criando resumo das baixas...');
        const resumo = baixasRealizadas.map((b, index) => {
          const linha = `• ${b.produto} (${b.local}): ${b.quantidadeVendida} unidades (${b.tipo})`;
          console.log(`📋 Linha ${index + 1} do resumo: ${linha}`);
          return linha;
        }).join('\n');
        
        console.log('📋 Resumo completo:', resumo);
        
        // Garantir que o alerta seja exibido
        setTimeout(() => {
          alert(`✅ Baixa no estoque realizada com sucesso!\n\nProdutos processados:\n${resumo}`);
        }, 50);
      } else {
        console.log('⚠️ Nenhuma baixa foi realizada - alerta não será exibido');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao dar baixa no estoque:', error);
      alert('❌ Erro ao dar baixa no estoque. Verifique os dados e tente novamente.');
      return false;
    }
  };

  // Função para reverter estoque quando pedido for cancelado
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
      const obterDataHoraLocalReversao = () => {
        const agora = new Date();
        const yyyy = String(agora.getFullYear());
        const mm = String(agora.getMonth() + 1).padStart(2, '0');
        const dd = String(agora.getDate()).padStart(2, '0');
        const data = `${yyyy}-${mm}-${dd}`;
        const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return { data, hora };
      };
      const { data: dataAtual, hora: horaAtual } = obterDataHoraLocalReversao();
      
      // Criar lançamentos de entrada para cada produto (reversão)
      const novosLancamentos = reversoesRealizadas.map((reversao, index) => ({
        id: Date.now() + Math.random() + index,
        data: dataAtual,
        hora: horaAtual,
        tipo: 'Entrada',
        fornecedor: 'Venda',
        descricao: reversao.produto,
        quantidade: reversao.quantidadeReversao,
        observacao: `Reversão - Pedido ${pedido.numeroPedido} cancelado`,
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

  // Função para criar ordem de compra automaticamente para produtos SE
  // Função para calcular 45 dias úteis a partir de uma data
  const calcular45DiasUteis = (dataInicial) => {
    if (!dataInicial) return '';
    
    const data = new Date(dataInicial);
    let diasUteis = 0;
    
    while (diasUteis < 45) {
      data.setDate(data.getDate() + 1);
      const diaSemana = data.getDay();
      // Contar apenas dias úteis (segunda a sexta)
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasUteis++;
      }
    }
    
    return data.toISOString().split('T')[0];
  };

  const criarOrdemCompraAutomatica = async (dadosPedido, produtosSE) => {
    try {
      console.log('🛒 === CRIANDO ORDEM DE COMPRA AUTOMÁTICA ===');
      console.log('📋 Pedido vinculado:', dadosPedido.numeroPedido);
      console.log('📦 Produtos SE:', produtosSE);

      // Buscar próxima OC disponível
      const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
      let ultimaOC = ordensExistentes.reduce((max, oc) => {
        const numero = parseInt(oc.oc?.replace('A-', '') || '0');
        return numero > max ? numero : max;
      }, 0);

      console.log('🔢 Última OC encontrada:', ultimaOC);

      // Preparar todos os produtos SE para uma única ordem de compra
      const produtosPreparados = produtosSE.map(produto => {
        const produtoCadastrado = produtosCadastrados.find(p => p.id === produto.produtoId);
        return {
          ...produto,
          produtoCadastrado
        };
      });

      console.log('📦 Produtos SE preparados:', produtosPreparados);

      // Gerar número de OC único para o pedido
      ultimaOC++;
      const proximaOC = `A-${String(ultimaOC).padStart(4, '0')}`;
      
      console.log('🔢 Gerando OC única:', proximaOC, 'para o pedido:', dadosPedido.numeroPedido);
      // Preparar itens da ordem de compra
      const itensOrdemCompra = produtosPreparados.map(produto => {
        const produtoCadastrado = produto.produtoCadastrado;
        // Usar fornecedor específico do produto ou "Sem Cadastro" se não estiver cadastrado
        const fornecedor = produtoCadastrado?.fornecedor || 'Sem Cadastro';
        
        // Calcular valores com base no fornecedor e tributos
        const valorUnitario = produto.valorUnitario || (produtoCadastrado?.custoLiquido || 0);
        const quantidade = parseInt(produto.quantidade) || 1;
        const valorTotal = quantidade * valorUnitario;
        
        return {
          produto: produto.produto,
          produtoId: produto.produtoId,
          sku: produtoCadastrado?.sku || '',
          categoria: produtoCadastrado?.categoria || '',
          quantidade: quantidade,
          valorUnitario: valorUnitario,
          valorTotal: valorTotal,
          fornecedor: fornecedor,
          fornecedorId: produtoCadastrado?.fornecedorId || '',
          fornecedorNome: fornecedor,
          observacoes: produto.observacoes || '',
          status: 'pendente',
          // Campos adicionais do produto
          descricao: produto.produto,
          unidade: 'UN',
          // Campos para cálculos futuros
          custoUnitario: produtoCadastrado?.custoUnitario || 0,
          margemLucro: produtoCadastrado?.margemLucro || 0,
          tributos: produtoCadastrado?.tributos || [],
          // Adicionar campos financeiros para preenchimento automático na interface
          custoBruto: produtoCadastrado?.custoBruto || 0,
          custoLiquido: produtoCadastrado?.custoLiquido || 0,
          frete: produtoCadastrado?.frete || 0,
          ipi: produtoCadastrado?.ipi || 0,
          desconto: produtoCadastrado?.descontos || '',
          tributoSelecionado: produtoCadastrado?.tributoSelecionado || '',
          local: produto.sl || 'SE',
          produtoNaoCadastrado: !produtoCadastrado
        };
      });

      // Calcular valor total da ordem
      const valorTotal = itensOrdemCompra.reduce((total, item) => total + item.valorTotal, 0);

      // Determinar o nome da fábrica principal (primeiro fornecedor válido ou "Sem Cadastro")
      const fabricaPrincipal = itensOrdemCompra.length > 0 ? itensOrdemCompra[0].fornecedor : 'Sem Cadastro';

      // Criar dados da ordem de compra única
      const dadosOrdemCompra = {
        id: Math.floor(Date.now() + Math.random() * 1000), // ID único inteiro para a ordem
        tipo: 'cliente', // Mudado de 'encomenda' para 'cliente' conforme solicitado
        status: 'Em aberto', // Status compatível com ListaOrdensCompra
        dataVenda: dadosPedido.dataVenda || new Date().toISOString().split('T')[0],
        dataEncomenda: '', // Deixar vazio conforme solicitado
        oc: proximaOC,
        numero: proximaOC, // Campo necessário para ListaOrdensCompra
        pedidoVinculado: dadosPedido.numeroPedido,
        vendedor: dadosPedido.vendedor || '',
        obsNaoEntregue: '',
        prazoFinal: calcular45DiasUteis(dadosPedido.dataVenda), // Calculado automaticamente
        dataEntradaDeposito: '',
        documentoFabrica: '',
        entregaCliente: '',
        prazoPagamento: '',
        observacoes: '',
        observacoesInternas: '',
        informacoesPedidoVenda: `Ordem de compra gerada automaticamente para o pedido de venda ${dadosPedido.numeroPedido}\n\nCliente: ${dadosPedido.cliente}\nPedido: ${dadosPedido.numeroPedido}\nVendedor: ${dadosPedido.vendedor}`,
        itens: itensOrdemCompra,
        fabrica: fabricaPrincipal, // Usar o primeiro fornecedor como fábrica principal
        fornecedor: fabricaPrincipal,
        fornecedorNome: fabricaPrincipal,
        data: new Date().toISOString().split('T')[0],
        valor: valorTotal, // Campo necessário para ListaOrdensCompra
        entradas: [],
        datasEntrega: [],
        // Campos adicionais para controle
        origem: 'pedido_venda_automatico',
        pedidoVendaId: dadosPedido.id,
        cliente: dadosPedido.cliente,
        clienteId: dadosPedido.clienteId,
        clienteCpfCnpj: dadosPedido.clienteCpfCnpj,
        clienteEmail: dadosPedido.clienteEmail,
        clienteTelefone: dadosPedido.clienteTelefone,
        // Campos de cálculo
        valorTotal: valorTotal,
        quantidadeItens: itensOrdemCompra.length,
        quantidadeTotal: itensOrdemCompra.reduce((total, item) => total + item.quantidade, 0),
        // Campos para rastreamento
        dataCriacao: new Date().toISOString(),
        criadoPor: 'Sistema Automático',
        ultimaAtualizacao: new Date().toISOString()
      };

      console.log('📋 Dados da ordem de compra criada:', dadosOrdemCompra);

      // Salvar a ordem de compra
      ordensExistentes.push(dadosOrdemCompra);
      localStorage.setItem('ordensCompra', JSON.stringify(ordensExistentes));
      
      console.log(`✅ Ordem de compra ${proximaOC} criada para o pedido ${dadosPedido.numeroPedido}`);
      
      // Não exibir popup de confirmação - apenas log no console
      console.log(`🎉 Ordem de compra ${proximaOC} criada automaticamente com ${itensOrdemCompra.length} produto(s) SE`);
      
      return [dadosOrdemCompra];

    } catch (error) {
      console.error('❌ Erro ao criar ordem de compra automática:', error);
      alert('❌ Erro ao criar ordem de compra automática. Verifique os dados e tente novamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!clienteSelecionado || !formData.vendedor) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validar estoque de todos os produtos
    const produtosComProblema = [];
    
    for (let i = 0; i < formData.produtos.length; i++) {
      const produto = formData.produtos[i];
      
      if (produto.sl && produto.sl !== 'SE' && produto.produtoId) {
        const produtoCadastrado = produtosCadastrados.find(p => p.id === produto.produtoId);
        if (produtoCadastrado) {
          const estoqueDisponivel = produtoCadastrado.estoque?.[produto.sl]?.quantidade || 0;
          const quantidadeSolicitada = parseInt(produto.quantidade) || 0;
          
          if (quantidadeSolicitada > estoqueDisponivel) {
            produtosComProblema.push({
              produto: produto.produto,
              local: produto.sl,
              solicitado: quantidadeSolicitada,
              disponivel: estoqueDisponivel
            });
          }
        }
      }
    }
    
    if (produtosComProblema.length > 0) {
      const mensagem = produtosComProblema.map(p => 
        `• ${p.produto} (${p.local}): ${p.solicitado} solicitadas, ${p.disponivel} disponíveis`
      ).join('\n');
      
      alert(`❌ Não é possível salvar o pedido. Os seguintes produtos excedem o estoque disponível:\n\n${mensagem}`);
      return;
    }

    try {
      // Preparar dados do pedido com informações do cliente
      const totais = calcularTotais();
      const valorFinalVenda = Number(totais.valorFinal);
      console.log('Totais calculados:', totais);
      console.log('Valor final da venda:', valorFinalVenda);
      
      // Verificar se o valor é válido
      if (isNaN(valorFinalVenda)) {
        alert('Erro ao calcular o valor do pedido. Verifique os dados dos produtos.');
        return;
      }
      
      const dadosPedido = {
        ...formData,
        cliente: clienteSelecionado.nome,
        clienteId: clienteSelecionado.id,
        clienteCpfCnpj: clienteSelecionado.cpfCnpj,
        clienteEmail: clienteSelecionado.email,
        clienteTelefone: clienteSelecionado.telefone1,
        valor: valorFinalVenda,
        descontoVenda: descontoVenda
      };
      
      console.log('Dados do pedido a serem salvos:', dadosPedido);

      // Verificar se é uma edição ou novo pedido
      const pedidoExistente = id ? await pedidosVendaService.buscarPorId(id) : null;
      const isEdicao = !!id;
      
      // Verificar se está cancelando o pedido
      const situacaoAnterior = pedidoExistente?.situacao || 'Em aberto';
      const situacaoNova = formData.situacao;
      const estaCancelando = situacaoNova === 'Cancelado' && situacaoAnterior !== 'Cancelado';
      
      // Determinar se deve dar baixa imediata
      const produtosComBaixa = formData.produtos.filter(p => p.sl !== 'SE');
      const deveDarBaixaImediata = produtosComBaixa.length > 0 && !estaCancelando;
      
      console.log('🔍 === DEBUG DEVE DAR BAIXA ===');
      console.log('📋 formData.produtos:', formData.produtos);
      console.log('📋 formData.produtos.length:', formData.produtos.length);
      console.log('🔍 produtosComBaixa (filtrados):', produtosComBaixa);
      console.log('🔍 produtosComBaixa.length:', produtosComBaixa.length);
      console.log('🚫 estaCancelando:', estaCancelando);
      console.log('✅ deveDarBaixaImediata:', deveDarBaixaImediata);
      console.log('🏁 === FIM DEBUG ===');
      
      if (id) {
        // Atualizar pedido existente
        await pedidosVendaService.atualizar(id, dadosPedido);
        
        // Notificar que o pedido foi atualizado
        alert('✅ Pedido atualizado com sucesso!');
        
        if (estaCancelando) {
          // Reverter estoque se está cancelando
          console.log('🚫 Processando cancelamento de pedido...');
          const reversaoRealizada = await reverterEstoque(dadosPedido);
          if (reversaoRealizada) {
            console.log('✅ Estoque revertido com sucesso para o pedido cancelado:', dadosPedido.numeroPedido);
          } else {
            console.warn('⚠️ Erro ao reverter estoque do pedido cancelado');
          }
        } else if (deveDarBaixaImediata) {
          // Dar baixa imediata se houver produtos não-SE
          console.log('🔄 Processando edição de pedido com baixa imediata...');
          console.log('🔍 PRODUTOS ENVIADOS PARA darBaixaEstoque:', formData.produtos);
          console.log(`📊 Total de produtos no pedido: ${formData.produtos.length}`);
          console.log(`📊 Produtos não-SE: ${produtosComBaixa.length}`);
          
          console.log('🚀 CHAMANDO darBaixaEstoque...');
          const baixaRealizada = await darBaixaEstoque(formData.produtos, true, pedidoExistente?.produtos || []);
          console.log('✅ darBaixaEstoque retornou:', baixaRealizada);
          
          if (!baixaRealizada) {
            alert('❌ Erro ao processar baixa no estoque. O pedido foi salvo, mas a baixa falhou.');
          }
          // Pequeno delay para garantir que o alerta da baixa apareça
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Adicionar novo pedido
        await pedidosVendaService.salvar(dadosPedido);
        
        // Notificar que o pedido foi salvo pela primeira vez
        alert('✅ Pedido salvo com sucesso!');
        
        if (estaCancelando) {
          // Reverter estoque se está cancelando
          console.log('🚫 Processando cancelamento de pedido novo...');
          const reversaoRealizada = await reverterEstoque(dadosPedido);
          if (reversaoRealizada) {
            console.log('✅ Estoque revertido com sucesso para o pedido cancelado:', dadosPedido.numeroPedido);
          } else {
            console.warn('⚠️ Erro ao reverter estoque do pedido cancelado');
          }
        } else if (deveDarBaixaImediata) {
          // Dar baixa imediata se houver produtos não-SE
          console.log('🆕 Processando novo pedido com baixa imediata...');
          console.log('🔍 PRODUTOS ENVIADOS PARA darBaixaEstoque:', formData.produtos);
          console.log(`📊 Total de produtos no pedido: ${formData.produtos.length}`);
          console.log(`📊 Produtos não-SE: ${produtosComBaixa.length}`);
          
          console.log('🚀 CHAMANDO darBaixaEstoque (novo pedido)...');
          const baixaRealizada = await darBaixaEstoque(formData.produtos, false, []);
          console.log('✅ darBaixaEstoque retornou:', baixaRealizada);
          
          if (!baixaRealizada) {
            alert('❌ Erro ao processar baixa no estoque. O pedido foi salvo, mas a baixa falhou.');
          }
          // Pequeno delay para garantir que o alerta da baixa apareça
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Verificar se há produtos SE para criar ordem de compra automaticamente
      const produtosSE = formData.produtos.filter(p => p.sl === 'SE');
      if (produtosSE.length > 0) {
        // Verificar se já existem ordens de compra para este pedido
        const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
        const ordensParaEstePedido = ordensExistentes.filter(oc => 
          oc.pedidoVinculado === dadosPedido.numeroPedido
        );
        
        if (ordensParaEstePedido.length === 0) {
          console.log('🛒 Produtos SE encontrados, criando ordem de compra automaticamente...');
          await criarOrdemCompraAutomatica(dadosPedido, produtosSE);
        } else {
          console.log(`⚠️ Já existem ${ordensParaEstePedido.length} ordem(ns) de compra para o pedido ${dadosPedido.numeroPedido}. Pulando criação automática.`);
        }
      }

      // Permanecer na tela do pedido após salvar
      // - Se for novo pedido, navegar para a rota de edição do pedido recém-salvo
      // - Se for edição, não navegar (permanece)
      if (!isEdicao) {
        // Buscar o último ID salvo para navegar à edição
        try {
          const todos = JSON.parse(localStorage.getItem('pravoceapp_pedidosVenda') || '[]');
          const ultimo = todos[todos.length - 1];
          if (ultimo && ultimo.id) {
            navigate(`/pedidos-venda/editar/${ultimo.id}`);
          } else {
            console.warn('Não foi possível determinar o ID do novo pedido. Permanecendo na página.');
          }
        } catch (e) {
          console.warn('Falha ao identificar novo pedido para navegação. Permanecendo na página.', e);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('Erro ao salvar pedido. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="min-h-screen bg-gray-100">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Novo Pedido de Venda</h1>
            <Link
              to="/pedidos-venda"
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Voltar
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 w-full">
            {/* Box de Dados do Pedido */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados do Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número do Pedido</label>
                  <input
                    type="text"
                    value={formData.numeroPedido}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite para buscar vendedor..."
                      value={formData.vendedor || buscaVendedor}
                      onChange={(e) => {
                        setBuscaVendedor(e.target.value);
                        setFormData(prev => ({ ...prev, vendedor: e.target.value }));
                        setMostrarSugestoesVendedor(true);
                      }}
                      onFocus={() => setMostrarSugestoesVendedor(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Sugestões de vendedores */}
                    {mostrarSugestoesVendedor && buscaVendedor && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {vendedoresFiltrados.map(vendedor => (
                          <div
                            key={vendedor.id}
                            onClick={() => selecionarVendedor(vendedor)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="font-medium">{vendedor.nome}</div>
                            <div className="text-sm text-gray-500">
                              {vendedor.cargo} • {vendedor.email}
                            </div>
                          </div>
                        ))}
                        {vendedoresFiltrados.length === 0 && (
                          <div className="px-4 py-2 text-gray-500">
                            Nenhum vendedor encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="situacao"
                    value={formData.situacao}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Em aberto">Em aberto</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Aguardando OC">Aguardando OC</option>
                    <option value="Agendar">Agendar</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Entregue Parcial">Entregue Parcial</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Não entregue">Não entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Vínculo com Outro Pedido */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="pedidoVinculado"
                    checked={formData.pedidoVinculado}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Pedido Vinculado?</label>
                </div>

                {formData.pedidoVinculado && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Vínculo</label>
                      <select
                        name="tipoVinculo"
                        value={formData.tipoVinculo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione...</option>
                        <option value="adicional">Adicional</option>
                        <option value="troca">Troca</option>
                        <option value="assistencia">Assistência</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Número do Pedido Vinculado</label>
                      <input
                        type="text"
                        name="numeroPedidoVinculado"
                        value={formData.numeroPedidoVinculado}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Observações do Pedido Vinculado</label>
                      <input
                        type="text"
                        name="observacoesVinculo"
                        value={formData.observacoesVinculo}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Box de Cliente */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cliente</h2>
              
              {/* Campo de busca e botão Novo Cliente - só aparece quando não há cliente selecionado */}
              {!clienteSelecionado && (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Digite nome, CPF/CNPJ ou telefone para buscar cliente..."
                        value={buscaCliente}
                        onChange={(e) => {
                          setBuscaCliente(e.target.value);
                          setMostrarSugestoesCliente(true);
                        }}
                        onFocus={() => setMostrarSugestoesCliente(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      {/* Sugestões de clientes */}
                      {mostrarSugestoesCliente && buscaCliente && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {clientesFiltrados.map(cliente => (
                            <div
                              key={cliente.id}
                              onClick={() => selecionarCliente(cliente)}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{cliente.nome}</div>
                              <div className="text-sm text-gray-600">
                                {cliente.tipoPessoa === 'pf' ? 'CPF: ' : 'CNPJ: '}{cliente.cpfCnpj}
                              </div>
                              <div className="text-sm text-gray-500">
                                Tel: {cliente.telefone1}
                                {cliente.telefone2 && ` / ${cliente.telefone2}`}
                              </div>
                              {cliente.email && (
                                <div className="text-sm text-gray-500">
                                  Email: {cliente.email}
                                </div>
                              )}
                            </div>
                          ))}
                          {clientesFiltrados.length === 0 && (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              Nenhum cliente encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleNovoCliente}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaPlus /> Novo Cliente
                    </button>
                  </div>
                </div>
              )}

                {/* Cliente selecionado */}
                {clienteSelecionado && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-lg">{clienteSelecionado.nome}</div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {clienteSelecionado.tipoPessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">
                              {clienteSelecionado.tipoPessoa === 'pf' ? 'CPF: ' : 'CNPJ: '}
                            </span>
                            <span className="text-gray-800">{clienteSelecionado.cpfCnpj}</span>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-gray-600">Tel 1: </span>
                              <span className="text-gray-800">{clienteSelecionado.telefone1}</span>
                            </div>
                            {clienteSelecionado.telefone2 && (
                              <div>
                                <span className="text-gray-600">Tel 2: </span>
                                <span className="text-gray-800">{clienteSelecionado.telefone2}</span>
                              </div>
                            )}
                          </div>
                          {clienteSelecionado.email && (
                            <div>
                              <span className="text-gray-600">Email: </span>
                              <span className="text-gray-800">{clienteSelecionado.email}</span>
                            </div>
                          )}
                          {clienteSelecionado.logradouro && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Endereço: </span>
                              <span className="text-gray-800">
                                {clienteSelecionado.logradouro}, {clienteSelecionado.numero}
                                {clienteSelecionado.complemento && ` - ${clienteSelecionado.complemento}`}
                                {clienteSelecionado.bairro && ` - ${clienteSelecionado.bairro}`}
                                {clienteSelecionado.cidade && ` - ${clienteSelecionado.cidade}`}
                                {clienteSelecionado.estado && `/${clienteSelecionado.estado}`}
                                {clienteSelecionado.cep && ` - CEP: ${clienteSelecionado.cep}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditarCliente(clienteSelecionado)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Editar cliente"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            const confirmacao = window.confirm(
                              'Tem certeza que deseja remover este cliente do pedido?'
                            );
                            if (confirmacao) {
                              setClienteSelecionado(null);
                              setBuscaCliente('');
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Remover cliente"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Box de Produtos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Produtos</h2>
                <button
                  type="button"
                  onClick={() => abrirModalProduto()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FaPlus />
                  Adicionar Produto
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '2%'}}>N.</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '3%'}}>Ações</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '4%'}}>SL</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '1.5%'}}>Qtd</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '50%'}}>Produto</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '10%'}}>Preço Lista</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '4%'}}>Desc</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '10%'}}>Preço Final</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '10%'}}>Preço Total</th>
                      <th className="px-2 py-2 text-left text-sm font-medium text-gray-700" style={{width: '1.5%'}}>Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.produtos.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-2 py-4 text-center text-gray-500">
                          Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
                        </td>
                      </tr>
                    ) : (
                      formData.produtos.map((produto, index) => {
                        const isMenuOpen = menuAcoes.isOpen && menuAcoes.produtoIndex === index;
                        return (
                          <tr key={index} className={isMenuOpen ? 'pb-20' : ''}>
                            <td className="px-2 py-2" style={{width: '2%'}}>
                              <div className="text-sm font-bold text-gray-600">{index + 1}</div>
                            </td>
                            <td className="px-2 py-2" style={{width: '3%'}}>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('Clique no botão dos 3 pontinhos para produto:', index);
                                    if (menuAcoes.isOpen && menuAcoes.produtoIndex === index) {
                                      // Fechar menu se já estiver aberto para este produto
                                      setMenuAcoes({ isOpen: false, produtoIndex: null });
                                    } else {
                                      // Abrir menu para este produto
                                      setMenuAcoes({ isOpen: true, produtoIndex: index });
                                    }
                                  }}
                                  className="text-gray-600 hover:text-gray-800 p-1"
                                  title="Ações"
                                >
                                  <FaEllipsisH />
                                </button>
                                
                                {/* Menu dropdown */}
                                {menuAcoes.isOpen && menuAcoes.produtoIndex === index && (
                                  <div className="absolute left-0 top-full mt-2 w-32 bg-white shadow-lg rounded-md border border-gray-200 z-[9999]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('Editando produto:', index);
                                        setMenuAcoes({ isOpen: false, produtoIndex: null });
                                        editarProduto(index);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <FaEdit className="text-blue-600" />
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('Excluindo produto:', index);
                                        setMenuAcoes({ isOpen: false, produtoIndex: null });
                                        excluirProduto(index);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <FaTrash className="text-red-600" />
                                      Excluir
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-2" style={{width: '4%'}}>
                              <div className="text-sm font-medium">{produto.sl?.toUpperCase()}</div>
                            </td>
                            <td className="px-2 py-2" style={{width: '1.5%'}}>
                              <div className="text-sm">{produto.quantidade}</div>
                            </td>
                            <td className="px-2 py-2" style={{width: '52%'}}>
                              <div className="text-sm">{produto.produto}</div>
                              {produto.sku && (
                                <div className="text-xs text-gray-500">
                                  SKU: {produto.sku}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2" style={{width: '10%'}}>
                              <div className="text-sm">{formatarValor(produto.precoLista)}</div>
                            </td>
                            <td className="px-2 py-2" style={{width: '4%'}}>
                              <div className="text-sm">
                                {(() => {
                                  const descontoProcessado = processarDesconto(produto.descontoLista);
                                  if (descontoProcessado.tipo === 'porcentagem') {
                                    return `${descontoProcessado.valor}%`;
                                  } else {
                                    return `R$ ${descontoProcessado.valor.toFixed(2)}`;
                                  }
                                })()}
                              </div>
                            </td>
                            <td className="px-2 py-2" style={{width: '10%'}}>
                              <div className="text-sm">{formatarValor(produto.precoFinal)}</div>
                            </td>
                            <td className="px-2 py-2" style={{width: '10%'}}>
                              <div className="text-sm font-semibold text-green-700">
                                {formatarValor(calcularPrecoTotalItem(produto.quantidade, produto.precoFinal))}
                              </div>
                            </td>
                            <td className="px-2 py-2" style={{width: '1.5%'}}>
                              {produto.observacoes && produto.observacoes.trim() && (
                                <button
                                  type="button"
                                  onClick={() => abrirModalObservacao(index, produto.observacoes)}
                                  className="text-yellow-500 hover:text-yellow-600 p-1"
                                  title="Ver observações"
                                >
                                  <FaExclamationTriangle />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Totais - Posicionado na parte inferior direita */}
              {formData.produtos.length > 0 && (
                <div className="flex flex-wrap justify-between items-end mt-4 pt-4 border-t border-gray-200">
                  {/* Campo de desconto extra no canto inferior esquerdo */}
                  <div className="flex flex-col items-start mb-2">
                    <label className="text-sm text-gray-600 mb-1">Desconto na venda</label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                      placeholder="Ex: 100 ou 10%"
                      value={descontoVenda}
                      onChange={e => setDescontoVenda(e.target.value)}
                    />
                    {calcularTotais().descontoExtra > 0 && (
                      <span className="text-xs text-red-500 mt-1">-R$ {calcularTotais().descontoExtra}</span>
                    )}
                  </div>
                  {/* Totais no canto inferior direito */}
                  <div className="flex flex-col items-end space-y-1 text-sm ml-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Total Lista:</span>
                      <span className="font-medium text-gray-800">
                        R$ {calcularTotais().valorTotal}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Desconto Total:</span>
                      <span className="font-medium text-red-600">
                        {Number(calcularTotais().desconto) > 0 ? `R$ ${calcularTotais().desconto}` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Valor Final:</span>
                      <span className="font-semibold text-lg text-green-600">
                        R$ {calcularTotais().valorFinal}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Forma de Pagamento</h2>
                <button
                  type="button"
                  onClick={addFormaPagamento}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FaPlus />
                  Nova Forma de Pagamento
                </button>
              </div>

              {formData.formasPagamento.map((forma, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <select
                      value={forma.tipo}
                      onChange={(e) => {
                        const newFormas = [...formData.formasPagamento];
                        newFormas[index] = { ...newFormas[index], tipo: e.target.value };
                        setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão Crédito</option>
                      <option value="cartao_debito">Cartão Débito</option>
                    </select>
                  </div>
                  {/* Campo Valor para Dinheiro e PIX */}
                  {(forma.tipo === 'dinheiro' || forma.tipo === 'pix') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={forma.valor}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index] = { ...newFormas[index], valor: e.target.value };
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        placeholder="0,00"
                      />
                    </div>
                  )}

                  {/* Campos para Cartão Crédito */}
                  {forma.tipo === 'cartao_credito' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <input
                          type="number"
                          step="0.01"
                          value={forma.valor}
                          onChange={(e) => {
                            const newFormas = [...formData.formasPagamento];
                            newFormas[index] = { ...newFormas[index], valor: e.target.value };
                            setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parcelas</label>
                        <input
                          type="number"
                          value={forma.parcelas}
                          onChange={(e) => {
                            const newFormas = [...formData.formasPagamento];
                            newFormas[index] = { ...newFormas[index], parcelas: e.target.value };
                            setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bandeira</label>
                        <input
                          type="text"
                          value={forma.bandeira}
                          onChange={(e) => {
                            const newFormas = [...formData.formasPagamento];
                            newFormas[index] = { ...newFormas[index], bandeira: e.target.value };
                            setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* Campos para Cartão Débito */}
                  {forma.tipo === 'cartao_debito' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bandeira</label>
                        <input
                          type="text"
                          value={forma.bandeira}
                          onChange={(e) => {
                            const newFormas = [...formData.formasPagamento];
                            newFormas[index] = { ...newFormas[index], bandeira: e.target.value };
                            setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <input
                          type="number"
                          step="0.01"
                          value={forma.valor}
                          onChange={(e) => {
                            const newFormas = [...formData.formasPagamento];
                            newFormas[index] = { ...newFormas[index], valor: e.target.value };
                            setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <input
                      type="text"
                      value={forma.observacoes}
                      onChange={(e) => {
                        const newFormas = [...formData.formasPagamento];
                        newFormas[index] = { ...newFormas[index], observacoes: e.target.value };
                        setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      placeholder="Observações sobre o pagamento"
                    />
                  </div>
                  <div className="flex items-center justify-start">
                    <button
                      type="button"
                      onClick={() => removeFormaPagamento(index)}
                      className="text-red-600 hover:text-red-800 p-2 mt-6"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Condicionais */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Condicionais</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Contra Entrega */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 min-w-[180px]">
                        Possui contra entrega?
                      </label>
                      <select
                        name="contraEntrega"
                        value={formData.contraEntrega}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    
                    {formData.contraEntrega === 'sim' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor da contra entrega
                          </label>
                          <input
                            type="number"
                            name="valorContraEntrega"
                            value={formData.valorContraEntrega}
                            onChange={handleChange}
                            placeholder="0,00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Forma de pagamento
                          </label>
                          <input
                            type="text"
                            name="formaPagamentoContraEntrega"
                            value={formData.formaPagamentoContraEntrega}
                            onChange={handleChange}
                            placeholder="Ex: Dinheiro, PIX, Cartão..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            name="obsContraEntrega"
                            value={formData.obsContraEntrega}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Observações sobre a contra entrega..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anti-Manchas */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 min-w-[180px]">
                        Anti-Manchas
                      </label>
                      <select
                        name="antiManchas"
                        value={formData.antiManchas}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    
                    {formData.antiManchas === 'sim' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor do Anti-Manchas
                          </label>
                          <input
                            type="number"
                            name="valorAntiManchas"
                            value={formData.valorAntiManchas}
                            onChange={handleChange}
                            placeholder="0,00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prestador
                          </label>
                          <input
                            type="text"
                            name="prestadorAntiManchas"
                            value={formData.prestadorAntiManchas}
                            onChange={handleChange}
                            placeholder="Nome do prestador..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Local de Aplicação
                          </label>
                          <input
                            type="text"
                            name="localAplicacaoAntiManchas"
                            value={formData.localAplicacaoAntiManchas}
                            onChange={handleChange}
                            placeholder="Local onde será aplicado..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Degustação Delivery */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 min-w-[180px]">
                        Degustação Delivery
                      </label>
                      <select
                        name="degustacaoDelivery"
                        value={formData.degustacaoDelivery}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    
                    {formData.degustacaoDelivery === 'sim' && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            name="observacoesDegustacaoDelivery"
                            value={formData.observacoesDegustacaoDelivery}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Observações sobre a degustação delivery..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Logística e Retirada */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Logística e Retirada</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Valor do Frete */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Frete
                      </label>
                      <input
                        type="number"
                        name="valorFrete"
                        value={formData.valorFrete}
                        onChange={handleChange}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Retirou no Ato da Compra */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium text-gray-700 min-w-[180px]">
                        Retirou no ato da compra?
                      </label>
                      <select
                        name="retiradaAtoCompra"
                        value={formData.retiradaAtoCompra}
                        onChange={handleChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    
                    {formData.retiradaAtoCompra === 'sim' && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Itens e Quantidade Retirada:
                          </label>
                          <textarea
                            name="itensRetirados"
                            value={formData.itensRetirados}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Descreva os itens e quantidades retiradas..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Observações</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações Visíveis</label>
                  <textarea
                    name="observacoesVisiveis"
                    value={formData.observacoesVisiveis}
                    onChange={handleChange}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações Internas</label>
                  <textarea
                    name="observacoesInternas"
                    value={formData.observacoesInternas}
                    onChange={handleChange}
                    rows="4"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Salvar Pedido
              </button>
            </div>
          </div>

          {/* Modal de Observações */}
          {modalObservacao.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-lg font-semibold mb-4">Observações do Produto</h3>
                <textarea
                  value={modalObservacao.observacao}
                  onChange={(e) => setModalObservacao(prev => ({ ...prev, observacao: e.target.value }))}
                  className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  placeholder="Digite suas observações aqui..."
                />
                <div className="mt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={fecharModalObservacao}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarObservacao}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Produtos */}
          {modalProduto.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-6">
                  {modalProduto.produtoIndex !== null ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Local</label>
                    <select
                      value={modalProduto.produto.sl}
                      onChange={(e) => setModalProduto(prev => ({
                        ...prev,
                        produto: { ...prev.produto, sl: e.target.value }
                      }))}
                      required
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione um local...</option>
                      <option value="SE">SE - Sob Encomenda</option>
                      {locaisAtivos.map((local) => (
                        <option key={local.id} value={local.sigla}>
                          {local.sigla} - {local.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                    <input
                      type="number"
                      value={modalProduto.produto.quantidade}
                      onChange={(e) => {
                        const quantidade = e.target.value;
                        const quantidadeNum = parseInt(quantidade) || 0;
                        
                        // Verificar se excede o estoque disponível
                        let estoqueDisponivel = 0;
                        if (modalProduto.produto.sl && modalProduto.produto.sl !== 'SE' && modalProduto.produto.produtoId) {
                          const produtoCadastrado = produtosCadastrados.find(p => p.id === modalProduto.produto.produtoId);
                          if (produtoCadastrado) {
                            estoqueDisponivel = produtoCadastrado.estoque?.[modalProduto.produto.sl]?.quantidade || 0;
                          }
                        }
                        
                        // Se excede o estoque e não é SE, mostrar aviso
                        if (quantidadeNum > estoqueDisponivel && modalProduto.produto.sl !== 'SE' && estoqueDisponivel > 0) {
                          alert(`⚠️ Atenção: Estoque disponível em ${modalProduto.produto.sl}: ${estoqueDisponivel} unidades`);
                        }
                        
                        // O preço final não muda com a quantidade, apenas o preço total do item
                        setModalProduto(prev => ({
                          ...prev,
                          produto: { ...prev.produto, quantidade }
                        }));
                      }}
                      required
                      min="1"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    />
                    {modalProduto.produto.sl && modalProduto.produto.sl !== 'SE' && modalProduto.produto.produtoId && (
                      <div className="mt-1 text-sm">
                        {(() => {
                          const produtoCadastrado = produtosCadastrados.find(p => p.id === modalProduto.produto.produtoId);
                          const estoqueDisponivel = produtoCadastrado?.estoque?.[modalProduto.produto.sl]?.quantidade || 0;
                          const quantidadeSolicitada = parseInt(modalProduto.produto.quantidade) || 0;
                          
                          if (estoqueDisponivel === 0) {
                            return <span className="text-red-600">❌ Sem estoque disponível em {modalProduto.produto.sl}</span>;
                          } else if (quantidadeSolicitada > estoqueDisponivel) {
                            return <span className="text-orange-600">⚠️ Quantidade excede estoque disponível ({estoqueDisponivel} un.)</span>;
                          } else {
                            return <span className="text-green-600">✅ Estoque disponível: {estoqueDisponivel} unidades</span>;
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={modalProduto.produto.produto}
                        onChange={(e) => {
                          setModalProduto(prev => ({
                            ...prev,
                            produto: { ...prev.produto, produto: e.target.value }
                          }));
                          setBuscaProduto(e.target.value);
                          setMostrarSugestoesProduto(true);
                          setProdutoIndexAtual(modalProduto.produtoIndex);
                        }}
                        onFocus={() => {
                          setMostrarSugestoesProduto(true);
                          setProdutoIndexAtual(modalProduto.produtoIndex);
                        }}
                        required
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        placeholder="Digite para buscar produtos..."
                      />
                      {modalProduto.produto.sku && (
                        <div className="text-xs text-gray-500 mt-1">
                          SKU: {modalProduto.produto.sku}
                        </div>
                      )}
                      
                      {/* Dropdown de sugestões de produtos */}
                      {mostrarSugestoesProduto && produtoIndexAtual === modalProduto.produtoIndex && buscaProduto && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {produtosFiltrados.map((produtoCadastrado) => (
                            <button
                              key={produtoCadastrado.id}
                              type="button"
                              onClick={() => {
                                setModalProduto(prev => ({
                                  ...prev,
                                  produto: {
                                    ...prev.produto,
                                    produto: produtoCadastrado.descricao,
                                    fabrica: produtoCadastrado.fornecedor,
                                    produtoId: produtoCadastrado.id,
                                    sku: produtoCadastrado.sku,
                                    precoLista: produtoCadastrado.tabc ? Number(produtoCadastrado.tabc).toFixed(2) : '',
                                    descontoLista: '0%',
                                    precoFinal: produtoCadastrado.tabc ? Number(produtoCadastrado.tabc).toFixed(2) : ''
                                  }
                                }));
                                setBuscaProduto('');
                                setMostrarSugestoesProduto(false);
                                setProdutoIndexAtual(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100"
                            >
                              <div className="font-medium">{produtoCadastrado.descricao}</div>
                              <div className="text-sm text-gray-500">
                                SKU: {produtoCadastrado.sku} | {produtoCadastrado.fornecedor} | 
                                TABC: {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(produtoCadastrado.tabc)}
                                {modalProduto.produto.sl && modalProduto.produto.sl !== 'SE' && (
                                  <span className="ml-2 text-green-600">
                                    • Estoque: {produtoCadastrado.estoque?.[modalProduto.produto.sl]?.quantidade || 0} un.
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                          {produtosFiltrados.length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              {modalProduto.produto.sl && modalProduto.produto.sl !== 'SE' 
                                ? `Nenhum produto encontrado com estoque disponível em ${modalProduto.produto.sl}`
                                : 'Nenhum produto encontrado'
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fábrica */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fábrica</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={modalProduto.produto.fabrica}
                        onChange={(e) => {
                          setModalProduto(prev => ({
                            ...prev,
                            produto: { ...prev.produto, fabrica: e.target.value }
                          }));
                          setBuscaFornecedor(e.target.value);
                          setMostrarSugestoesFornecedor(true);
                          setFornecedorIndexAtual(modalProduto.produtoIndex);
                        }}
                        onFocus={() => {
                          if (modalProduto.produto.sl === 'SE' && !modalProduto.produto.produtoId) {
                            setMostrarSugestoesFornecedor(true);
                            setFornecedorIndexAtual(modalProduto.produtoIndex);
                          }
                        }}
                        disabled={modalProduto.produto.sl !== 'SE' || modalProduto.produto.produtoId}
                        className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          modalProduto.produto.sl === 'SE' && !modalProduto.produto.produtoId ? 'bg-white' : 'bg-gray-100'
                        }`}
                        placeholder={
                          modalProduto.produto.sl === 'SE' && !modalProduto.produto.produtoId 
                            ? 'Digite o fabricante/fornecedor' 
                            : 'Selecione um produto cadastrado'
                        }
                      />
                      
                      {/* Dropdown de sugestões de fornecedores */}
                      {mostrarSugestoesFornecedor && fornecedorIndexAtual === modalProduto.produtoIndex && 
                       modalProduto.produto.sl === 'SE' && !modalProduto.produto.produtoId && buscaFornecedor && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {fornecedoresFiltrados.map((fornecedor) => (
                            <button
                              key={fornecedor.id}
                              type="button"
                              onClick={() => {
                                setModalProduto(prev => ({
                                  ...prev,
                                  produto: { ...prev.produto, fabrica: fornecedor.nomeFantasia }
                                }));
                                setBuscaFornecedor('');
                                setMostrarSugestoesFornecedor(false);
                                setFornecedorIndexAtual(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100"
                            >
                              <div className="font-medium">{fornecedor.nomeFantasia}</div>
                              <div className="text-sm text-gray-500">
                                {fornecedor.razaoSocial && fornecedor.razaoSocial !== fornecedor.nomeFantasia && (
                                  <span>Razão Social: {fornecedor.razaoSocial}</span>
                                )}
                                {fornecedor.cnpj && (
                                  <span className="ml-2">CNPJ: {fornecedor.cnpj}</span>
                                )}
                              </div>
                            </button>
                          ))}
                          {fornecedoresFiltrados.length === 0 && (
                            <div className="px-4 py-2 text-gray-500">
                              Nenhum fornecedor encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {modalProduto.produto.sl === 'SE' && !modalProduto.produto.produtoId && (
                      <div className="mt-1 text-xs text-blue-600">
                        💡 Campo editável para produtos sob encomenda
                      </div>
                    )}
                    {modalProduto.produto.sl === 'SE' && modalProduto.produto.produtoId && (
                      <div className="mt-1 text-xs text-gray-500">
                        ℹ️ Produto cadastrado - fábrica não editável
                      </div>
                    )}
                  </div>

                  {/* Preço Lista */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço Lista</label>
                    <input
                      type="number"
                      value={modalProduto.produto.precoLista}
                      onChange={(e) => {
                        const precoLista = e.target.value;
                        const descontoLista = modalProduto.produto.descontoLista;
                        const precoFinal = calcularPrecoFinal(precoLista, descontoLista);
                        setModalProduto(prev => ({
                          ...prev,
                          produto: { 
                            ...prev.produto, 
                            precoLista,
                            precoFinal
                          }
                        }));
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  {/* Desconto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Desconto (R$ ou %)</label>
                    <input
                      type="text"
                      value={modalProduto.produto.descontoLista}
                      onChange={(e) => {
                        const descontoLista = e.target.value;
                        const precoLista = modalProduto.produto.precoLista;
                        const precoFinal = calcularPrecoFinal(precoLista, descontoLista);
                        setModalProduto(prev => ({
                          ...prev,
                          produto: { 
                            ...prev.produto, 
                            descontoLista,
                            precoFinal
                          }
                        }));
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      placeholder="Ex: 10% ou 50,00"
                    />
                  </div>

                  {/* Preço Final */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço Final</label>
                    <input
                      type="text"
                      value={formatarValor(modalProduto.produto.precoFinal)}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100"
                    />
                  </div>

                  {/* Preço Total do Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço Total</label>
                    <input
                      type="text"
                      value={formatarValor(calcularPrecoTotalItem(modalProduto.produto.quantidade, modalProduto.produto.precoFinal))}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-green-50 font-semibold text-green-700"
                    />
                  </div>

                  {/* Observações */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                    <textarea
                      value={modalProduto.produto.observacoes}
                      onChange={(e) => setModalProduto(prev => ({
                        ...prev,
                        produto: { ...prev.produto, observacoes: e.target.value }
                      }))}
                      rows="3"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      placeholder="Observações sobre o produto..."
                    />
                  </div>


                </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={fecharModalProduto}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarProduto}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

      </div>
    </form>
  );
};

export default NovoPedidoVenda; 