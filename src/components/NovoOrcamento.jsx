import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSearch, FaTrash, FaEdit, FaTimes, FaCalculator, FaMedal } from 'react-icons/fa';
import FormularioCliente from './FormularioCliente';
import { colaboradoresService } from '../services/database';

const NovoOrcamento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    id: null,
    numeroOrcamento: '',
    data: new Date().toISOString().split('T')[0],
    cliente: '',
    telefone: '',
    vendedor: '',
    validade: '',
    descontoGeral: '',
    produtos: [{
      sl: '',
      quantidade: '',
      produto: '',
      precoLista: '',
      descontoLista: '',
      precoFinal: '',
      observacoes: ''
    }],
    formasPagamento: [{
      tipo: '',
      parcelas: '',
      bandeira: '',
      valor: '',
      observacoes: ''
    }],
    observacoes: '',
    observacoesInternas: '',
    dataCriacao: new Date().toISOString().split('T')[0]
  });

  const [modalObservacao, setModalObservacao] = useState({
    isOpen: false,
    produtoIndex: null,
    observacao: ''
  });

  const [showFormularioCliente, setShowFormularioCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  
  // Estados para vendedores ativos
  const [vendedoresAtivos, setVendedoresAtivos] = useState([]);

  // Estados para produtos cadastrados
  const [produtosCadastrados, setProdutosCadastrados] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [mostrarSugestoesProduto, setMostrarSugestoesProduto] = useState(false);
  const [produtoIndexAtual, setProdutoIndexAtual] = useState(null);

  // Carregar clientes do localStorage
  useEffect(() => {
    const carregarClientes = () => {
      const clientesSalvos = localStorage.getItem('clientes');
      if (clientesSalvos) {
        setClientes(JSON.parse(clientesSalvos));
      }
    };
    carregarClientes();
  }, []);

  // Carregar vendedores ativos do banco de dados
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

  // Carregar produtos cadastrados
  useEffect(() => {
    const carregarProdutos = () => {
      try {
        const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
        console.log('Produtos carregados:', produtos.length, produtos);
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

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setMostrarSugestoesProduto(false);
        setProdutoIndexAtual(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carregar o próximo número de orçamento
  useEffect(() => {
    const carregarProximoNumero = () => {
      const orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');
      const ultimoOrcamento = orcamentos.reduce((maior, orcamento) => {
        const numeroAtual = parseInt(orcamento.numeroOrcamento);
        return numeroAtual > maior ? numeroAtual : maior;
      }, 0);
      
      const proximoNumero = (ultimoOrcamento + 1).toString().padStart(5, '0');
      setFormData(prev => ({
        ...prev,
        numeroOrcamento: proximoNumero,
        id: Date.now() // ID único para controle interno
      }));
    };

    if (!id) {
      carregarProximoNumero();
    } else {
      // Carregar dados do orçamento existente
      const orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');
      const orcamentoExistente = orcamentos.find(o => o.id === parseInt(id));
      if (orcamentoExistente) {
        setFormData(orcamentoExistente);
        // Verificar se o cliente do orçamento existe na lista de clientes cadastrados
        const clienteExistente = clientes.find(c => c.nome === orcamentoExistente.cliente);
        if (clienteExistente) {
          setClienteSelecionado(clienteExistente);
        }
      } else {
        navigate('/orcamentos');
      }
    }
  }, [id, navigate, clientes]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Validação especial para descontoGeral
    if (name === 'descontoGeral') {
      // Permitir números, vírgula, ponto e %
      if (/^[\d.,%]*$/.test(value) || value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProdutoChange = (index, field, value) => {
    console.log('handleProdutoChange:', index, field, value);
    
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

    // Recalcular preço final quando quantidade mudar (para atualizar totais)
    if (field === 'quantidade') {
      // O preço final por item não muda, mas os totais sim
      newProdutos[index].precoFinal = calcularPrecoFinal(
        newProdutos[index].precoLista,
        newProdutos[index].descontoLista
      );
    }

    console.log('Novo produto atualizado:', newProdutos[index]);
    setFormData(prev => ({ ...prev, produtos: newProdutos }));
  };

  const selecionarProdutoCadastrado = (produto, index) => {
    console.log('Produto selecionado:', produto);
    
    const newProdutos = [...formData.produtos];
    newProdutos[index] = {
      ...newProdutos[index],
      produto: produto.descricao || '',
      precoLista: produto.tabc || '0',
      descontoLista: '0',
      precoFinal: produto.tabc || '0'
    };

    console.log('Produto atualizado:', newProdutos[index]);
    setFormData(prev => ({ ...prev, produtos: newProdutos }));
    setMostrarSugestoesProduto(false);
    setProdutoIndexAtual(null);
    setBuscaProduto('');
  };

  const produtosFiltrados = buscaProduto 
    ? produtosCadastrados.filter(produto =>
        produto.descricao?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
        produto.sku?.toLowerCase().includes(buscaProduto.toLowerCase())
      )
    : produtosCadastrados;

  // Debug: log dos produtos filtrados
  useEffect(() => {
    console.log('Produtos filtrados:', produtosFiltrados.length, 'Busca:', buscaProduto);
    console.log('Produtos cadastrados total:', produtosCadastrados.length);
  }, [produtosFiltrados, buscaProduto, produtosCadastrados]);

  const addProduto = () => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, {
        sl: '',
        quantidade: '',
        produto: '',
        precoLista: '',
        descontoLista: '',
        precoFinal: '',
        observacoes: ''
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

  const calcularPrecoFinal = (precoLista, descontoLista) => {
    if (!precoLista) return '';
    
    let desconto = 0;
    if (descontoLista) {
      // Verificar se é porcentagem (contém %)
      if (descontoLista.includes('%')) {
        const percentual = parseFloat(descontoLista.replace('%', ''));
        desconto = (precoLista * percentual) / 100;
      } else {
        // É valor em real
        desconto = parseFloat(descontoLista) || 0;
      }
    }
    
    return (precoLista - desconto).toFixed(2);
  };

  const calcularTotais = () => {
    console.log('Calculando totais para produtos:', formData.produtos);
    
    const totais = formData.produtos.reduce((acc, produto) => {
      const quantidade = Number(produto.quantidade) || 0;
      const precoLista = Number(produto.precoLista) || 0;
      const descontoLista = produto.descontoLista || '0';
      const precoFinal = calcularPrecoFinal(produto.precoLista, produto.descontoLista);
      
      console.log('Produto:', produto.produto, 'Qtd:', quantidade, 'Preço:', precoLista, 'Desconto:', descontoLista, 'Final:', precoFinal);
      
      // Calcular desconto por item
      let descontoItem = 0;
      if (descontoLista) {
        if (descontoLista.includes('%')) {
          const percentual = parseFloat(descontoLista.replace('%', ''));
          descontoItem = (precoLista * percentual) / 100;
        } else {
          descontoItem = parseFloat(descontoLista) || 0;
        }
      }
      
      return {
        valorTotal: acc.valorTotal + (precoLista * quantidade),
        desconto: acc.desconto + (descontoItem * quantidade),
        valorFinal: acc.valorFinal + (Number(precoFinal) * quantidade || 0)
      };
    }, { valorTotal: 0, desconto: 0, valorFinal: 0 });

    // Aplicar desconto geral
    let descontoGeral = 0;
    if (formData.descontoGeral) {
      if (formData.descontoGeral.includes('%')) {
        const percentual = parseFloat(formData.descontoGeral.replace('%', ''));
        descontoGeral = (totais.valorFinal * percentual) / 100;
      } else {
        descontoGeral = parseFloat(formData.descontoGeral) || 0;
      }
    }

    const valorFinalComDescontoGeral = totais.valorFinal - descontoGeral;

    console.log('Totais calculados:', totais, 'Desconto geral:', descontoGeral);

    return {
      valorTotal: totais.valorTotal.toFixed(2),
      desconto: (totais.desconto + descontoGeral).toFixed(2),
      valorFinal: valorFinalComDescontoGeral.toFixed(2)
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

  const formatarValor = (valor) => {
    if (!valor) return '0,00';
    return Number(valor).toFixed(2).replace('.', ',');
  };

  const handleNovoCliente = () => {
    setShowFormularioCliente(true);
  };

  const handleClienteSalvo = (novoCliente) => {
    setClientes(prev => [...prev, novoCliente]);
    setClienteSelecionado(novoCliente);
    setFormData(prev => ({
      ...prev,
      cliente: novoCliente.nome,
      telefone: novoCliente.telefone
    }));
    setShowFormularioCliente(false);
    setBuscaCliente('');
  };

  const handleEditarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setShowFormularioCliente(true);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    (cliente.cpf && cliente.cpf.includes(buscaCliente)) ||
    (cliente.telefone1 && cliente.telefone1.includes(buscaCliente))
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!formData.cliente || !formData.vendedor) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Carregar orçamentos existentes
    const orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');

    if (id) {
      // Atualizar orçamento existente
      const index = orcamentos.findIndex(o => o.id === parseInt(id));
      if (index !== -1) {
        orcamentos[index] = {
          ...orcamentos[index],
          ...formData,
          dataAtualizacao: new Date().toISOString()
        };
      }
    } else {
      // Adicionar novo orçamento
      orcamentos.push({
        ...formData,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      });
    }

    // Salvar no localStorage
    localStorage.setItem('orcamentos', JSON.stringify(orcamentos));

    // Redirecionar para a lista
    navigate('/orcamentos');
  };

  const totais = calcularTotais();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Novo Orçamento</h1>
        <Link
          to="/orcamentos"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        {/* Box de Dados do Orçamento */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaCalculator className="mr-2 text-blue-600" />
            Dados do Orçamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do Orçamento</label>
              <input
                type="text"
                value={formData.numeroOrcamento}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <select
                name="vendedor"
                value={formData.vendedor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione...</option>
                {vendedoresAtivos.map(vendedor => (
                  <option key={vendedor.id} value={vendedor.nome}>{vendedor.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validade do Orçamento</label>
              <input
                type="date"
                name="validade"
                value={formData.validade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Box de Dados do Cliente */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            Dados do Cliente
            {clienteSelecionado && (
              <button
                onClick={() => alert('Este é um cliente já cadastrado no sistema.')}
                className="text-yellow-500 hover:text-yellow-600"
                title="Cliente já cadastrado"
              >
                <FaMedal />
              </button>
            )}
          </h2>
          
          {/* Busca e Seleção de Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite o nome"
                  value={formData.cliente}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, cliente: e.target.value }));
                    setBuscaCliente(e.target.value);
                    if (!e.target.value) {
                      setClienteSelecionado(null);
                      setFormData(prev => ({ ...prev, telefone: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {clienteSelecionado && (
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir o cliente selecionado?')) {
                        setClienteSelecionado(null);
                        setFormData(prev => ({ ...prev, cliente: '', telefone: '' }));
                        setBuscaCliente('');
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                    title="Excluir cliente selecionado"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              {/* Lista de clientes filtrados */}
              {buscaCliente && !clienteSelecionado && clientesFiltrados.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto absolute z-10 bg-white w-full">
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setClienteSelecionado(cliente);
                        setFormData(prev => ({
                          ...prev,
                          cliente: cliente.nome,
                          telefone: cliente.telefone1 || cliente.telefone
                        }));
                        setBuscaCliente('');
                      }}
                    >
                      <div className="font-medium flex items-center gap-2">
                        {cliente.nome}
                        <FaMedal className="text-yellow-500 text-sm" title="Cliente já cadastrado" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {cliente.telefone1 || cliente.telefone}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mensagem quando não há clientes encontrados */}
              {buscaCliente && !clienteSelecionado && clientesFiltrados.length === 0 && (
                <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50 absolute z-10 w-full">
                  <p className="text-sm text-gray-600">Nenhum cliente encontrado com esse nome, CPF ou telefone.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Box de Produtos */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Produtos</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Estado atual dos produtos:', formData.produtos);
                  console.log('Totais atuais:', totais);
                }}
                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
              >
                Debug
              </button>
              <button
                type="button"
                onClick={addProduto}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaPlus className="mr-1" />
                Adicionar Produto
              </button>
            </div>
          </div>

          {formData.produtos.map((produto, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-800">Produto {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeProduto(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="w-[8%]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd.</label>
                  <input
                    type="number"
                    value={produto.quantidade}
                    onChange={(e) => handleProdutoChange(index, 'quantidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="w-[55%]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={produto.produto}
                      onChange={(e) => {
                        handleProdutoChange(index, 'produto', e.target.value);
                        setBuscaProduto(e.target.value);
                        setProdutoIndexAtual(index);
                        setMostrarSugestoesProduto(true);
                      }}
                      onFocus={() => {
                        setProdutoIndexAtual(index);
                        setMostrarSugestoesProduto(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Digite o nome do produto..."
                    />
                    
                    {/* Sugestões de produtos cadastrados */}
                    {mostrarSugestoesProduto && produtoIndexAtual === index && produtosFiltrados.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {produtosFiltrados.map((produtoCadastrado, idx) => (
                          <div
                            key={idx}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              console.log('Clicou no produto:', produtoCadastrado);
                              selecionarProdutoCadastrado(produtoCadastrado, index);
                            }}
                          >
                            <div className="font-medium text-gray-900">
                              {produtoCadastrado.descricao}
                            </div>
                            <div className="text-sm text-gray-600">
                              {produtoCadastrado.sku && `SKU: ${produtoCadastrado.sku}`}
                              {produtoCadastrado.tabc && ` • TABC: R$ ${Number(produtoCadastrado.tabc).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-[12%]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Lista</label>
                  <input
                    type="number"
                    step="0.01"
                    value={produto.precoLista}
                    onChange={(e) => handleProdutoChange(index, 'precoLista', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="w-[10%]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                  <input
                    type="text"
                    value={produto.descontoLista}
                    onChange={(e) => {
                      const valor = e.target.value;
                      // Permitir números, vírgula, ponto e %
                      if (/^[\d.,%]*$/.test(valor) || valor === '') {
                        handleProdutoChange(index, 'descontoLista', valor);
                      }
                    }}
                    placeholder="0 ou 0%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="w-[15%]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Total</label>
                  <input
                    type="text"
                    value={(() => {
                      const quantidade = Number(produto.quantidade) || 0;
                      const precoLista = Number(produto.precoLista) || 0;
                      const descontoLista = produto.descontoLista || '0';
                      
                      let desconto = 0;
                      if (descontoLista) {
                        if (descontoLista.includes('%')) {
                          const percentual = parseFloat(descontoLista.replace('%', ''));
                          desconto = (precoLista * percentual) / 100;
                        } else {
                          desconto = parseFloat(descontoLista) || 0;
                        }
                      }
                      
                      const precoComDesconto = precoLista - desconto;
                      const precoTotal = quantidade * precoComDesconto;
                      
                      return precoTotal > 0 ? precoTotal.toFixed(2) : '';
                    })()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => abrirModalObservacao(index, produto.observacoes)}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaEdit className="mr-1" />
                  Observações
                </button>
                {produto.observacoes && (
                  <span className="text-sm text-gray-600">
                    {produto.observacoes.length > 50 
                      ? produto.observacoes.substring(0, 50) + '...' 
                      : produto.observacoes
                    }
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Box de Totais */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumo do Orçamento</h2>
          
          {/* Campo de Desconto Geral */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Geral</label>
            <input
              type="text"
              name="descontoGeral"
              value={formData.descontoGeral}
              onChange={handleChange}
              placeholder="0 ou 0% (ex: 50 ou 10%)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Valor Total</div>
              <div className="text-2xl font-bold text-gray-900">R$ {formatarValor(totais.valorTotal)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Desconto Total</div>
              <div className="text-2xl font-bold text-red-600">R$ {formatarValor(totais.desconto)}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Valor Final</div>
              <div className="text-2xl font-bold text-blue-600">R$ {formatarValor(totais.valorFinal)}</div>
            </div>
          </div>
        </div>

        {/* Box de Formas de Pagamento */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Formas de Pagamento</h2>
            <button
              type="button"
              onClick={addFormaPagamento}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaPlus className="mr-1" />
              Adicionar Forma
            </button>
          </div>

          {formData.formasPagamento.map((forma, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Forma de Pagamento {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeFormaPagamento(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={forma.tipo}
                    onChange={(e) => {
                      const newFormas = [...formData.formasPagamento];
                      newFormas[index].tipo = e.target.value;
                      setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione...</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
                {/* Campo Valor para Dinheiro e PIX */}
                {(forma.tipo === 'dinheiro' || forma.tipo === 'pix') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={forma.valor}
                      onChange={(e) => {
                        const newFormas = [...formData.formasPagamento];
                        newFormas[index].valor = e.target.value;
                        setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0,00"
                    />
                  </div>
                )}

                {/* Campos para Cartão Crédito */}
                {forma.tipo === 'cartao_credito' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={forma.valor}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index].valor = e.target.value;
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                      <input
                        type="text"
                        value={forma.parcelas}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index].parcelas = e.target.value;
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira</label>
                      <input
                        type="text"
                        value={forma.bandeira}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index].bandeira = e.target.value;
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}

                {/* Campos para Cartão Débito */}
                {forma.tipo === 'cartao_debito' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bandeira</label>
                      <input
                        type="text"
                        value={forma.bandeira}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index].bandeira = e.target.value;
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={forma.valor}
                        onChange={(e) => {
                          const newFormas = [...formData.formasPagamento];
                          newFormas[index].valor = e.target.value;
                          setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0,00"
                      />
                    </div>
                  </>
                )}

                {/* Campos para outros tipos (boleto, transferência) */}
                {(forma.tipo === 'boleto' || forma.tipo === 'transferencia') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={forma.valor}
                      onChange={(e) => {
                        const newFormas = [...formData.formasPagamento];
                        newFormas[index].valor = e.target.value;
                        setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0,00"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <input
                    type="text"
                    value={forma.observacoes}
                    onChange={(e) => {
                      const newFormas = [...formData.formasPagamento];
                      newFormas[index].observacoes = e.target.value;
                      setFormData(prev => ({ ...prev, formasPagamento: newFormas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Box de Observações */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Observações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Visível ao Cliente)</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Observações que aparecerão no orçamento..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
              <textarea
                name="observacoesInternas"
                value={formData.observacoesInternas}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Observações internas da empresa..."
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/orcamentos')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Orçamento
          </button>
        </div>
      </div>

      {/* Modal de Observações */}
      {modalObservacao.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Observações do Produto</h3>
            <textarea
              value={modalObservacao.observacao}
              onChange={(e) => setModalObservacao(prev => ({ ...prev, observacao: e.target.value }))}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              placeholder="Digite as observações..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={fecharModalObservacao}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarObservacao}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovoOrcamento; 