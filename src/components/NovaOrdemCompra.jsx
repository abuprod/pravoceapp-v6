import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  FaPlus, 
  FaSave, 
  FaSearch, 
  FaEnvelope, 
  FaInfoCircle, 
  FaChevronDown, 
  FaChevronUp, 
  FaBolt,
  FaCheck,
  FaPaperclip,
  FaTrash,
  FaExclamationCircle,
  FaPaperPlane,
  FaPrint,
  FaArrowLeft,
  FaCalendarAlt
} from 'react-icons/fa';

// Adicionar estilo global para remover o ícone de calendário
const globalStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    display: none;
    -webkit-appearance: none;
  }
`;

const NovaOrdemCompra = ({ tipoPreSelecionado }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipo: tipoPreSelecionado || '',
    status: 'aberto',
    dataVenda: new Date().toISOString().split('T')[0],
    dataEncomenda: new Date().toISOString().split('T')[0], // Preencher com data atual
    oc: '',
    pedidoVinculado: '',
    vendedor: '',
    obsNaoEntregue: '',
    prazoFinal: '',
    dataEntradaDeposito: '',
    documentoFabrica: '',
    entregaCliente: '',
    prazoPagamento: '',
    observacoes: '',
    observacoesInternas: '',
    itens: [],
    fabrica: '',
    fornecedor: '',
    fornecedorNome: '',
    data: new Date().toISOString().split('T')[0],
    // Novos campos para Dados de Pós Recebimento
    entradas: [],
    datasEntrega: []
  });

  const [pedidoOriginal, setPedidoOriginal] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showChangesAlert, setShowChangesAlert] = useState(false);

  const [expandedItems, setExpandedItems] = useState({});
  const [nextOC, setNextOC] = useState('A-0001');
  const [emailStatus, setEmailStatus] = useState({});
  const [showObservacaoPopup, setShowObservacaoPopup] = useState(null);
  const [showAnexoPopup, setShowAnexoPopup] = useState(null);
  const [documentosPorItem, setDocumentosPorItem] = useState({});

  const [nextOCEstoque, setNextOCEstoque] = useState('B-0001');
  const [nextOCAssistencia, setNextOCAssistencia] = useState('C-0001');

  const [itensEnviados, setItensEnviados] = useState({});
  const [itensSelecionados, setItensSelecionados] = useState({});
  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [sugestoesProdutos, setSugestoesProdutos] = useState([]);
  const [sugestoesFornecedores, setSugestoesFornecedores] = useState([]);
  const [tributosDisponiveis, setTributosDisponiveis] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [sugestoesVendedores, setSugestoesVendedores] = useState([]);
  const [sugestoesFabricas, setSugestoesFabricas] = useState([]);

  // Estados para o popup de duplicata
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateOC, setDuplicateOC] = useState('');
  const [dadosPosRecebimentoExpanded, setDadosPosRecebimentoExpanded] = useState(true);
  
  // Estados para popups de confirmação
  const [showConfirmDeleteEntrada, setShowConfirmDeleteEntrada] = useState(null);
  const [showConfirmEditEntrada, setShowConfirmEditEntrada] = useState(null);
  const [showConfirmDeleteEntrega, setShowConfirmDeleteEntrega] = useState(null);
  const [showConfirmEditEntrega, setShowConfirmEditEntrega] = useState(null);

  // Estado para controlar qual campo de produto está ativo
  const [campoProdutoAtivo, setCampoProdutoAtivo] = useState(null);

  // Função para buscar a próxima OC disponível por tipo
  const buscarProximaOC = (tipo) => {
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    
    let prefixo = '';
    switch (tipo) {
      case 'cliente':
        prefixo = 'A-';
        break;
      case 'estoque':
        prefixo = 'B-';
        break;
      case 'assistencia':
        prefixo = 'C-';
        break;
      default:
        return '';
    }

    // Buscar a próxima OC disponível baseada na sequência global
    // Extrair números de TODAS as OCs existentes (independente do tipo)
    const todasOCs = ordensExistentes
      .filter(ordem => ordem.oc && ordem.oc.match(/^[ABC]-\d+$/))
      .map(ordem => {
        const match = ordem.oc.match(/^[ABC]-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });

    if (todasOCs.length === 0) {
      return `${prefixo}0001`;
    }

    // Encontrar o próximo número disponível
    const proximoNumero = Math.max(...todasOCs) + 1;
    return `${prefixo}${proximoNumero.toString().padStart(4, '0')}`;
  };

  // Função para verificar se uma OC já existe
  const verificarOCExistente = (oc) => {
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    return ordensExistentes.some(ordem => ordem.oc === oc);
  };

  // Carregar dados da ordem se estiver em modo de edição
  useEffect(() => {
    if (id) {
      const ordensSalvas = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
      const ordemParaEditar = ordensSalvas.find(ordem => ordem.id === parseInt(id));
      
      if (ordemParaEditar) {
        console.log('Ordem encontrada para edição:', ordemParaEditar);
        // Mapear fornecedorId para fornecedor se existir
        const dadosParaEditar = {
          ...ordemParaEditar,
          fornecedor: ordemParaEditar.fornecedorId || ordemParaEditar.fornecedor || '',
          fornecedorNome: ordemParaEditar.fornecedorNome || ordemParaEditar.fornecedor || ''
        };
        
        console.log('Dados mapeados para edição:', dadosParaEditar);
        setFormData(dadosParaEditar);
        setPedidoOriginal(dadosParaEditar);
      } else {
        // Se não encontrar a ordem, redireciona para a lista
        navigate('/ordens-compra');
      }
    }
  }, [id, navigate]);

  // Gerar OC automaticamente quando o tipo estiver pré-selecionado
  useEffect(() => {
    if (tipoPreSelecionado && !id) {
      const proximaOC = buscarProximaOC(tipoPreSelecionado);
      setFormData(prev => ({
        ...prev,
        tipo: tipoPreSelecionado,
        oc: proximaOC,
        status: 'aberto'
      }));
      
      if (tipoPreSelecionado === 'cliente') {
        setNextOC(proximaOC);
      } else if (tipoPreSelecionado === 'estoque') {
        setNextOCEstoque(proximaOC);
      } else if (tipoPreSelecionado === 'assistencia') {
        setNextOCAssistencia(proximaOC);
      }
    }
  }, [tipoPreSelecionado, id]);

  // Carregar fornecedores e produtos
  useEffect(() => {
    const fornecedoresSalvos = JSON.parse(localStorage.getItem('fornecedores') || '[]');
    console.log('Fornecedores carregados:', fornecedoresSalvos);
    setFornecedores(fornecedoresSalvos);
    
    const produtosSalvos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
    setProdutos(produtosSalvos);

    const colaboradoresSalvos = JSON.parse(localStorage.getItem('pravoceapp_colaboradores') || '[]');
    setColaboradores(colaboradoresSalvos);
  }, []);

  // Inicializar prazo quando o componente for montado
  useEffect(() => {
    if (formData.dataVenda && !formData.prazoFinal) {
      const prazoCalculado = calcular45DiasUteis(formData.dataVenda);
      setFormData(prev => ({
        ...prev,
        prazoFinal: prazoCalculado
      }));
    }
  }, [formData.dataVenda]);

  // Carregar tributos disponíveis quando o fornecedor for selecionado
  useEffect(() => {
    if (!formData.fornecedor) {
      setTributosDisponiveis([]);
      return;
    }

    const fornecedorSelecionado = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
    if (fornecedorSelecionado) {
      setTributosDisponiveis(fornecedorSelecionado.tributosDescontos || []);
    }
  }, [formData.fornecedor, fornecedores]);

  // Sincronizar campo fabrica com fornecedor e carregar tributos automaticamente
  useEffect(() => {
    if (formData.fabrica && fornecedores.length > 0) {
      const fornecedorEncontrado = fornecedores.find(f => 
        f.nomeFantasia === formData.fabrica || f.razaoSocial === formData.fabrica
      );
      
      if (fornecedorEncontrado) {
        // Atualizar o campo fornecedor com o ID
        setFormData(prev => ({
          ...prev,
          fornecedor: fornecedorEncontrado.id.toString()
        }));
        
        // Carregar os tributos automaticamente
        setTributosDisponiveis(fornecedorEncontrado.tributosDescontos || []);
        
        console.log('Fornecedor sincronizado:', fornecedorEncontrado.nomeFantasia, 'ID:', fornecedorEncontrado.id);
        console.log('Tributos carregados:', fornecedorEncontrado.tributosDescontos);
      }
    }
  }, [formData.fabrica, fornecedores]);

  // Simulação de dados de fabricante
  const fabricanteData = {
    'Móveis ABC': {
      prazo: 30,
      frete: 100.00,
      ipi: 150.00,
      desconto: 0.00
    },
    'Móveis XYZ': {
      prazo: 45,
      frete: 150.00,
      ipi: 200.00,
      desconto: 50.00
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calcular prazo automaticamente quando a data da venda for alterada
    if (name === 'dataVenda' && value) {
      const prazoCalculado = calcular45DiasUteis(value);
      setFormData(prev => ({
        ...prev,
        prazoFinal: prazoCalculado
      }));
    }

    if (name === 'tipo') {
      if (value === 'cliente') {
        const proximaOC = buscarProximaOC('cliente');
        setFormData(prev => ({
          ...prev,
          oc: proximaOC,
          status: 'aberto'
        }));
        setNextOC(proximaOC);
      } else if (value === 'estoque') {
        const proximaOC = buscarProximaOC('estoque');
        setFormData(prev => ({
          ...prev,
          oc: proximaOC,
          status: 'aberto'
        }));
        setNextOCEstoque(proximaOC);
      } else if (value === 'assistencia') {
        const proximaOC = buscarProximaOC('assistencia');
        setFormData(prev => ({
          ...prev,
          oc: proximaOC,
          status: 'aberto'
        }));
        setNextOCAssistencia(proximaOC);
      }
    }

    // Verificar se houve alteração em relação ao pedido original
    if (pedidoOriginal) {
      const hasChanged = name === 'dataVenda' ? value !== pedidoOriginal.dataVenda :
                        name === 'vendedor' ? value !== pedidoOriginal.vendedor : false;
      setHasChanges(hasChanged);
    }
  };

  // Funções para gerenciar Dados de Pós Recebimento
  const handleAddEntrada = () => {
    setFormData(prev => ({
      ...prev,
      entradas: [...(prev.entradas || []), { 
        dataEntrada: '', 
        documentoFabrica: '', 
        dataDocumento: '', 
        observacao: '',
        salvo: false,
        editando: true
      }]
    }));
  };

  const handleEntradaChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      entradas: prev.entradas.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSalvarEntrada = (index) => {
    setFormData(prev => ({
      ...prev,
      entradas: prev.entradas.map((item, i) => 
        i === index ? { ...item, salvo: true, editando: false } : item
      )
    }));
  };

  const handleEditarEntrada = (index) => {
    setShowConfirmEditEntrada(index);
  };

  const handleConfirmEditEntrada = (index) => {
    setFormData(prev => ({
      ...prev,
      entradas: prev.entradas.map((item, i) => 
        i === index ? { ...item, editando: true } : item
      )
    }));
    setShowConfirmEditEntrada(null);
  };

  const handleRemoveEntrada = (index) => {
    setShowConfirmDeleteEntrada(index);
  };

  const handleConfirmDeleteEntrada = (index) => {
    setFormData(prev => ({
      ...prev,
      entradas: prev.entradas.filter((_, i) => i !== index)
    }));
    setShowConfirmDeleteEntrada(null);
  };

  const handleAddDataEntrega = () => {
    setFormData(prev => ({
      ...prev,
      datasEntrega: [...(prev.datasEntrega || []), { 
        data: '', 
        observacao: '',
        salvo: false,
        editando: true
      }]
    }));
  };

  const handleDataEntregaChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      datasEntrega: prev.datasEntrega.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSalvarDataEntrega = (index) => {
    setFormData(prev => ({
      ...prev,
      datasEntrega: prev.datasEntrega.map((item, i) => 
        i === index ? { ...item, salvo: true, editando: false } : item
      )
    }));
  };

  const handleEditarDataEntrega = (index) => {
    setShowConfirmEditEntrega(index);
  };

  const handleConfirmEditEntrega = (index) => {
    setFormData(prev => ({
      ...prev,
      datasEntrega: prev.datasEntrega.map((item, i) => 
        i === index ? { ...item, editando: true } : item
      )
    }));
    setShowConfirmEditEntrega(null);
  };

  const handleRemoveDataEntrega = (index) => {
    setShowConfirmDeleteEntrega(index);
  };

  const handleConfirmDeleteEntrega = (index) => {
    setFormData(prev => ({
      ...prev,
      datasEntrega: prev.datasEntrega.filter((_, i) => i !== index)
    }));
    setShowConfirmDeleteEntrega(null);
  };

  const handleGerarOC = () => {
    if (formData.tipo === 'cliente') {
      const proximaOC = buscarProximaOC('cliente');
      setFormData(prev => ({
        ...prev,
        oc: proximaOC
      }));
      setNextOC(proximaOC);
    } else if (formData.tipo === 'estoque') {
      const proximaOC = buscarProximaOC('estoque');
      setFormData(prev => ({
        ...prev,
        oc: proximaOC
      }));
      setNextOCEstoque(proximaOC);
    } else if (formData.tipo === 'assistencia') {
      const proximaOC = buscarProximaOC('assistencia');
      setFormData(prev => ({
        ...prev,
        oc: proximaOC
      }));
      setNextOCAssistencia(proximaOC);
    }
  };

  // Função para verificar OC quando digitada manualmente
  const handleOCChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      oc: value
    }));

    // Limpar alerta anterior se existir
    if (showDuplicateAlert) {
      setShowDuplicateAlert(false);
    }
  };

  // Função para verificar OC quando o campo perder o foco (onBlur)
  const handleOCBlur = (e) => {
    const { value } = e.target;
    
    // Verificar se a OC já existe (apenas se não estiver vazia)
    if (value && value.trim() !== '') {
      const existe = verificarOCExistente(value);
      if (existe) {
        setDuplicateOC(value);
        setShowDuplicateAlert(true);
      }
    }
  };

  // Função para confirmar uso de OC duplicada
  const confirmarOCDuplicada = () => {
    setShowDuplicateAlert(false);
    // O usuário confirmou que quer usar a OC duplicada
    // Não fazer nada, deixar o valor como está
  };

  // Função para cancelar uso de OC duplicada
  const cancelarOCDuplicada = () => {
    setShowDuplicateAlert(false);
    // Limpar o campo OC para o usuário digitar novamente
    setFormData(prev => ({
      ...prev,
      oc: ''
    }));
  };

  const handleBuscarPedido = async () => {
    if (!formData.pedidoVinculado) return;

    // Simulação de busca do pedido
    const pedidoEncontrado = {
      dataVenda: '2024-03-20',
      vendedor: 'João Silva',
      produtos: [
        {
          quantidade: 2,
          descricao: 'Sofá 3 lugares',
          fabrica: 'Móveis ABC',
          sl: 'SL123',
          observacoes: 'Cor: Bege',
          custoBruto: 1500.00,
          frete: 100.00,
          ipi: 150.00,
          desconto: 0.00,
          prazoPagamento: '30 dias'
        },
        {
          quantidade: 1,
          descricao: 'Mesa de Jantar',
          fabrica: 'Móveis XYZ',
          sl: 'SL456',
          observacoes: '',
          custoBruto: 2000.00,
          frete: 150.00,
          ipi: 200.00,
          desconto: 50.00,
          prazoPagamento: '45 dias'
        }
      ]
    };

    // Calcular prazos baseados nos dados do fabricante
    const produtosComPrazo = pedidoEncontrado.produtos.map(produto => {
      const fabricante = fabricanteData[produto.fabrica];
      const dataVenda = new Date(pedidoEncontrado.dataVenda);
      dataVenda.setDate(dataVenda.getDate() + fabricante.prazo);
      
      return {
        ...produto,
        prazo: dataVenda.toISOString().split('T')[0],
        dataEncomenda: '',
        dataEntradaDP: '',
        dataEntrega: ''
      };
    });

    // Salvar os dados originais
    setPedidoOriginal({
      dataVenda: pedidoEncontrado.dataVenda,
      vendedor: pedidoEncontrado.vendedor,
      produtos: produtosComPrazo
    });

    setFormData(prev => ({
      ...prev,
      dataVenda: pedidoEncontrado.dataVenda,
      vendedor: pedidoEncontrado.vendedor,
      itens: produtosComPrazo
    }));

    setHasChanges(false);
  };

  const handleEnviarEmail = (index) => {
    // Simulação de envio de e-mail
    setEmailStatus(prev => ({
      ...prev,
      [index]: true
    }));
  };

  const handleObservacaoClick = (index) => {
    setShowObservacaoPopup(index);
  };

  const handleObservacaoChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { ...item, observacoes: value } : item
      )
    }));
  };

  const toggleExpandItem = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      aberto: 'bg-yellow-100 text-yellow-800',
      aprovado: 'bg-green-100 text-green-800',
      encomendado: 'bg-blue-100 text-blue-800',
      deposito: 'bg-purple-100 text-purple-800',
      agendado: 'bg-indigo-100 text-indigo-800',
      entregue: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      nao_entregue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      aberto: 'EM ABERTO',
      aprovado: 'APROVADO',
      encomendado: 'ENCOMENDADO',
      deposito: 'EM DEPÓSITO',
      agendado: 'AGENDADO',
      entregue: 'ENTREGUE',
      cancelado: 'CANCELADO',
      nao_entregue: 'NÃO ENTREGUE'
    };
    return labels[status] || status.toUpperCase();
  };

  const handleItemChange = (index, field, value) => {
    console.log('handleItemChange:', { index, field, value });
    
    setFormData(prev => {
      const newItens = prev.itens.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      
      console.log('Novo item após atualização:', newItens[index]);
      
      return {
        ...prev,
        itens: newItens,
        salvo: false // Resetar o estado de salvo quando houver alterações
      };
    });

    // Verificar se houve alteração em relação ao pedido original
    if (pedidoOriginal) {
      const originalItem = pedidoOriginal.produtos[index];
      if (!originalItem) return;

      // Campos que não devem disparar alerta de alteração
      const camposLivres = ['dataEncomenda', 'dataEntradaDP', 'dataEntrega'];
      if (camposLivres.includes(field)) return;

      const hasChanged = field === 'quantidade' ? value !== originalItem.quantidade :
                        field === 'descricao' ? value !== originalItem.descricao :
                        field === 'fabrica' ? value !== originalItem.fabrica :
                        field === 'prazo' ? value !== originalItem.prazo :
                        field === 'custoBruto' ? value !== originalItem.custoBruto :
                        field === 'frete' ? value !== originalItem.frete :
                        field === 'ipi' ? value !== originalItem.ipi :
                        field === 'desconto' ? value !== originalItem.desconto :
                        field === 'prazoPagamento' ? value !== originalItem.prazoPagamento : false;
      
      setHasChanges(hasChanged);
    }
  };

  const handleAddDocumento = (index) => {
    setDocumentosPorItem(prev => ({
      ...prev,
      [index]: (prev[index] || 1) + 1
    }));
  };

  const handleDeleteDocumento = (index, docIndex) => {
    // Verifica se é o último documento
    if (documentosPorItem[index] <= 1) return;

    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { 
          ...item, 
          [`documentoFabrica${docIndex}`]: undefined 
        } : item
      )
    }));

    // Atualiza o contador de documentos
    setDocumentosPorItem(prev => ({
      ...prev,
      [index]: prev[index] - 1
    }));
  };

  const handleAnexarDocumento = (index, docIndex) => {
    setShowAnexoPopup({ index, docIndex });
  };

  const getChanges = () => {
    if (!pedidoOriginal) return [];

    const changes = [];

    // Verificar alterações nos campos principais
    if (formData.dataVenda !== pedidoOriginal.dataVenda) {
      changes.push('Data de Venda');
    }
    if (formData.vendedor !== pedidoOriginal.vendedor) {
      changes.push('Vendedor');
    }

    // Verificar alterações nos itens
    formData.itens.forEach((item, index) => {
      const originalItem = pedidoOriginal.produtos[index];
      if (!originalItem) return;

      const itemChanges = [];
      if (item.quantidade !== originalItem.quantidade) itemChanges.push('Quantidade');
      if (item.descricao !== originalItem.descricao) itemChanges.push('Descrição');
      if (item.fabrica !== originalItem.fabrica) itemChanges.push('Fábrica');
      if (item.prazo !== originalItem.prazo) itemChanges.push('Prazo');
      if (item.custoBruto !== originalItem.custoBruto) itemChanges.push('Custo Bruto');
      if (item.frete !== originalItem.frete) itemChanges.push('Frete');
      if (item.ipi !== originalItem.ipi) itemChanges.push('IPI');
      if (item.desconto !== originalItem.desconto) itemChanges.push('Desconto');
      if (item.prazoPagamento !== originalItem.prazoPagamento) itemChanges.push('Prazo de Pagamento');

      if (itemChanges.length > 0) {
        changes.push(`Item ${index + 1}: ${itemChanges.join(', ')}`);
      }
    });

    return changes;
  };

  const calcularCustoTotal = () => {
    return formData.itens.reduce((total, item) => {
      const custoBruto = parseFloat(item.custoBruto) || 0;
      const quantidade = parseFloat(item.quantidade) || 0;
      return total + (custoBruto * quantidade);
    }, 0);
  };

  const calcularCustoLiquido = () => {
    return formData.itens.reduce((total, item) => {
      const custoBruto = parseFloat(item.custoBruto) || 0;
      const frete = parseFloat(item.frete) || 0;
      const ipi = parseFloat(item.ipi) || 0;
      const quantidade = parseFloat(item.quantidade) || 0;

      const valorFrete = custoBruto * (frete / 100);
      const valorIpi = (custoBruto + valorFrete) * (ipi / 100);
      
      // Calcular descontos em cascata
      let valorComDescontos = custoBruto + valorFrete + valorIpi;
      if (item.desconto && item.desconto !== '') {
        try {
          const descontos = item.desconto.split('+').map(d => parseFloat(d.trim()) / 100);
          descontos.forEach(desconto => {
            if (!isNaN(desconto)) {
              valorComDescontos = valorComDescontos * (1 - desconto);
            }
          });
        } catch (error) {
          console.error('Erro ao calcular descontos:', error);
        }
      }

      return total + (valorComDescontos * quantidade);
    }, 0);
  };

  const calcularCustoLiquidoUnitario = (item) => {
    // Se não há tributo selecionado, retornar "-"
    if (!item.tributoSelecionado || item.tributoSelecionado === '') {
      return '-';
    }
    
    const custoBruto = parseFloat(item.custoBruto) || 0;
    const frete = parseFloat(item.frete) || 0;
    const ipi = parseFloat(item.ipi) || 0;

    const valorFrete = custoBruto * (frete / 100);
    const valorIpi = (custoBruto + valorFrete) * (ipi / 100);
    
    // Calcular descontos em cascata
    let valorComDescontos = custoBruto + valorFrete + valorIpi;
    if (item.desconto && item.desconto !== '') {
      try {
        const descontos = item.desconto.split('+').map(d => parseFloat(d.trim()) / 100);
        descontos.forEach(desconto => {
          if (!isNaN(desconto)) {
            valorComDescontos = valorComDescontos * (1 - desconto);
          }
        });
      } catch (error) {
        console.error('Erro ao calcular descontos:', error);
      }
    }

    return valorComDescontos;
  };

  const calcularCustoLiquidoItem = (item) => {
    // Se não há tributo selecionado, retornar "-"
    if (!item.tributoSelecionado || item.tributoSelecionado === '') {
      return '-';
    }
    
    const custoBruto = parseFloat(item.custoBruto) || 0;
    const frete = parseFloat(item.frete) || 0;
    const ipi = parseFloat(item.ipi) || 0;
    const quantidade = parseFloat(item.quantidade) || 0;

    const valorFrete = custoBruto * (frete / 100);
    const valorIpi = (custoBruto + valorFrete) * (ipi / 100);
    
    // Calcular descontos em cascata
    let valorComDescontos = custoBruto + valorFrete + valorIpi;
    if (item.desconto && item.desconto !== '') {
      try {
        const descontos = item.desconto.split('+').map(d => parseFloat(d.trim()) / 100);
        descontos.forEach(desconto => {
          if (!isNaN(desconto)) {
            valorComDescontos = valorComDescontos * (1 - desconto);
          }
        });
      } catch (error) {
        console.error('Erro ao calcular descontos:', error);
      }
    }

    return valorComDescontos * quantidade;
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      itens: [
        ...prev.itens,
        {
          quantidade: 1,
          descricao: '',
          fabrica: '',
          sl: '',
          observacoes: '',
          custoBruto: 0,
          frete: 0,
          ipi: 0,
          desconto: 0,
          tributoSelecionado: '',
          prazoPagamento: '',
          dataEncomenda: '',
          dataEntradaDP: '',
          dataEntrega: ''
        }
      ]
    }));
    
    // Limpar sugestões quando adicionar novo item
    setSugestoesProdutos([]);
    setCampoProdutoAtivo(null);
  };

  const handleDeleteItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
    
    // Limpar sugestões quando deletar item
    setSugestoesProdutos([]);
    setCampoProdutoAtivo(null);
  };

  const handleEnviarFornecedor = () => {
    if (!formData.enviado) {
      setFormData(prev => ({
        ...prev,
        enviado: true,
        dataEnvio: new Date().toISOString()
      }));
    }
  };

  const handleSalvar = () => {
    console.log('=== INICIANDO SALVAMENTO ===');
    console.log('formData atual:', formData);
    
    // Obter nome do fornecedor selecionado
    const fornecedorSelecionado = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
    const nomeFornecedor = fornecedorSelecionado ? fornecedorSelecionado.nomeFantasia : (formData.fornecedorNome || 'Não especificado');
    
    console.log('Fornecedor selecionado:', fornecedorSelecionado);
    console.log('Nome do fornecedor:', nomeFornecedor);
    
    // Obter nomes dos conjuntos de tributação selecionados
    const itensComTributos = formData.itens.map(item => {
      let tributoNome = '';
      if (item.tributoSelecionado && item.tributoSelecionado !== '') {
        if (item.tributoSelecionado === 'nenhum') {
          tributoNome = 'Nenhum';
        } else if (item.tributoSelecionado === 'personalizado') {
          tributoNome = 'Personalizado';
        } else if (fornecedorSelecionado) {
          const tributo = fornecedorSelecionado.tributosDescontos.find(t => String(t.id) === String(item.tributoSelecionado));
          tributoNome = tributo ? tributo.nome : 'Conjunto não encontrado';
        }
      }
      
      console.log(`Item ${item.descricao}: tributoSelecionado=${item.tributoSelecionado}, tributoNome=${tributoNome}`);
      
      return {
        ...item,
        tributoNome: tributoNome
      };
    });

    const ordemAtualizada = {
      ...formData,
      dataAtualizacao: new Date().toISOString(),
      valor: calcularCustoLiquido(),
      fornecedor: nomeFornecedor,
      fornecedorId: formData.fornecedor,
      fornecedorNome: formData.fornecedorNome,
      itens: itensComTributos
    };

    console.log('Ordem atualizada para salvar:', ordemAtualizada);

    // Carregar ordens existentes
    const ordensExistentes = JSON.parse(localStorage.getItem('ordensCompra') || '[]');
    console.log('Ordens existentes:', ordensExistentes);
    
    let novasOrdens;
    if (id) {
      // Modo de edição: atualizar ordem existente
      novasOrdens = ordensExistentes.map(ordem => 
        ordem.id === parseInt(id) ? ordemAtualizada : ordem
      );
      console.log('Atualizando ordem existente com ID:', id);
    } else {
      // Modo de criação: adicionar nova ordem
      ordemAtualizada.id = Date.now();
      ordemAtualizada.dataCriacao = new Date().toISOString();
      ordemAtualizada.numero = formData.oc;
      novasOrdens = [...ordensExistentes, ordemAtualizada];
      console.log('Criando nova ordem com ID:', ordemAtualizada.id);
    }
    
    console.log('Novas ordens para salvar:', novasOrdens);
    
    // Salvar no localStorage
    localStorage.setItem('ordensCompra', JSON.stringify(novasOrdens));
    console.log('=== SALVAMENTO CONCLUÍDO ===');

    // Redirecionar para a lista de ordens
    navigate('/ordens-compra');
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleEnviarItem = (index) => {
    if (itensSelecionados[index]) {
      setItensEnviados(prev => ({
        ...prev,
        [index]: {
          enviado: true,
          dataEnvio: new Date().toISOString()
        }
      }));
    }
  };

  const handleSelecionarItem = (index) => {
    setItensSelecionados(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Buscar produtos por descrição
  const handleBuscarProduto = (descricao, index) => {
    console.log('=== INÍCIO handleBuscarProduto ===');
    console.log('Descrição:', descricao);
    console.log('Index:', index);
    console.log('Tipo de OC:', formData.tipo);
    console.log('Fornecedor selecionado:', formData.fornecedor);
    console.log('Fábrica selecionada:', formData.fabrica);
    console.log('Total de produtos disponíveis:', produtos.length);
    console.log('Total de fornecedores disponíveis:', fornecedores.length);
    
    // Se não há descrição ou é muito curta, limpar sugestões
    if (!descricao || descricao.length < 2) {
      console.log('Descrição muito curta, limpando sugestões');
      setSugestoesProdutos([]);
      setCampoProdutoAtivo(null);
      return;
    }

    // Verificar se um fornecedor/fábrica foi selecionada baseado no tipo de OC
    let fornecedorSelecionado = null;
    let fornecedorId = null;
    if (formData.tipo === 'estoque') {
      // Na tela de estoque, verificar fornecedor
      if (!formData.fornecedor) {
        console.log('❌ Nenhum fornecedor selecionado na tela de estoque');
        setSugestoesProdutos([]);
        setCampoProdutoAtivo(null);
        return;
      }
      fornecedorId = formData.fornecedor;
      // Buscar o nome do fornecedor para comparação
      const fornecedorEncontrado = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
      fornecedorSelecionado = fornecedorEncontrado ? fornecedorEncontrado.nomeFantasia : '';
      console.log('✅ Fornecedor encontrado na tela de estoque:', fornecedorEncontrado);
      console.log('ID do fornecedor:', fornecedorId);
      console.log('Nome do fornecedor:', fornecedorSelecionado);
    } else {
      // Na tela de cliente, verificar fábrica
      if (!formData.fabrica) {
        console.log('❌ Nenhuma fábrica selecionada na tela de cliente');
        setSugestoesProdutos([]);
        setCampoProdutoAtivo(null);
        return;
      }
      fornecedorSelecionado = formData.fabrica;
      console.log('✅ Fábrica selecionada na tela de cliente:', fornecedorSelecionado);
    }

    // Definir qual campo está ativo
    setCampoProdutoAtivo(index);

    console.log('=== DEBUG FILTRAGEM PRODUTOS ===');
    console.log('Descrição buscada:', descricao);
    console.log('Tipo de OC:', formData.tipo);
    console.log('Fornecedor/Fábrica selecionada:', fornecedorSelecionado);
    console.log('Total de produtos:', produtos.length);
    console.log('Campo ativo:', index);
    
    // Filtrar produtos por descrição
    let produtosFiltrados = produtos.filter(produto => 
      produto.descricao.toLowerCase().includes(descricao.toLowerCase())
    );
    
    console.log('Produtos com descrição similar:', produtosFiltrados.length);
    console.log('Primeiros produtos encontrados:', produtosFiltrados.slice(0, 3));

    // TEMPORÁRIO: Para debug, mostrar todos os produtos sem filtro
    if (formData.tipo === 'estoque') {
      console.log('🔧 MODO DEBUG: Mostrando todos os produtos sem filtro para teste');
      console.log('Produtos disponíveis:', produtosFiltrados);
      
      // Por enquanto, retornar todos os produtos para teste
      // produtosFiltrados = produtosFiltrados; // Já está assim
    } else {
      // Filtrar apenas produtos do fornecedor/fábrica selecionada
      // Verificar se produto.fornecedor é ID ou nome
      console.log('=== FILTRAGEM POR FORNECEDOR/FÁBRICA ===');
      produtosFiltrados = produtosFiltrados.filter(produto => {
        console.log(`🔍 Analisando produto: ${produto.descricao}`);
        console.log(`   - Tipo do produto.fornecedor: ${typeof produto.fornecedor}`);
        console.log(`   - Valor do produto.fornecedor: ${produto.fornecedor}`);
        console.log(`   - Fornecedor/Fábrica selecionada: ${fornecedorSelecionado}`);
        
        // Na tela de cliente, comparar nomes de fábrica
        if (typeof produto.fornecedor === 'number' || !isNaN(produto.fornecedor)) {
          const fornecedorProduto = fornecedores.find(f => f.id === parseInt(produto.fornecedor));
          if (fornecedorProduto) {
            const match = fornecedorProduto.nomeFantasia === fornecedorSelecionado || 
                         fornecedorProduto.razaoSocial === fornecedorSelecionado;
            console.log(`   ✅ Fornecedor encontrado: ${fornecedorProduto.nomeFantasia}, Match: ${match}`);
            return match;
          }
        }
        
        // Se produto.fornecedor for uma string (nome), comparar diretamente
        const match = produto.fornecedor === fornecedorSelecionado;
        console.log(`   ✅ Comparação direta: ${produto.fornecedor} === ${fornecedorSelecionado} = ${match}`);
        return match;
      });
    }
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Produtos após filtro de fornecedor/fábrica:', produtosFiltrados.length);
    console.log('Produtos finais:', produtosFiltrados);
    
    // Se não há produtos filtrados, limpar sugestões
    if (produtosFiltrados.length === 0) {
      console.log('❌ Nenhum produto encontrado, limpando sugestões');
      setSugestoesProdutos([]);
      setCampoProdutoAtivo(null);
      return;
    }

    // Atualizar sugestões imediatamente
    console.log('✅ Produtos encontrados, atualizando sugestões:', produtosFiltrados.length);
    setSugestoesProdutos(produtosFiltrados);
    console.log('=== FIM handleBuscarProduto ===');
  };

  // Selecionar produto da sugestão
  const handleSelecionarProduto = (produto, index) => {
    console.log('Produto selecionado:', produto);
    console.log('Tributos disponíveis no momento da seleção:', tributosDisponiveis);
    console.log('Fornecedor atual:', formData.fornecedor);
    console.log('Fábrica atual:', formData.fabrica);
    
    // Verificar se os tributos foram carregados corretamente
    if (tributosDisponiveis.length > 0) {
      console.log('✅ Tributos carregados com sucesso:', tributosDisponiveis.length, 'conjuntos disponíveis');
      tributosDisponiveis.forEach((tributo, idx) => {
        console.log(`  ${idx + 1}. ${tributo.nome || 'Sem nome'} (ID: ${tributo.id})`);
      });
    } else {
      console.log('❌ Nenhum tributo disponível. Verificando fornecedor...');
      if (formData.fornecedor) {
        const fornecedorAtual = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
        if (fornecedorAtual) {
          console.log('Fornecedor encontrado:', fornecedorAtual.nomeFantasia);
          console.log('Tributos do fornecedor:', fornecedorAtual.tributosDescontos);
        } else {
          console.log('Fornecedor não encontrado no array de fornecedores');
        }
      } else {
        console.log('Campo fornecedor está vazio');
      }
    }
    
    const itemAtualizado = {
      ...formData.itens[index],
      descricao: produto.descricao,
      custoBruto: produto.custoBruto || 0,
      frete: 0, // Zerar frete inicialmente
      ipi: 0, // Zerar IPI inicialmente
      desconto: '', // Zerar desconto inicialmente
      tributoSelecionado: '' // Zerar tributo selecionado
    };
    
    handleItemChange(index, 'descricao', produto.descricao);
    handleItemChange(index, 'custoBruto', produto.custoBruto || 0);
    handleItemChange(index, 'frete', 0); // Zerar frete
    handleItemChange(index, 'ipi', 0); // Zerar IPI
    handleItemChange(index, 'desconto', ''); // Zerar desconto
    handleItemChange(index, 'tributoSelecionado', ''); // Zerar tributo selecionado
    
    console.log('Item atualizado com valores zerados:', itemAtualizado);
    setSugestoesProdutos([]);
    setCampoProdutoAtivo(null);
  };

  // Aplicar dados do fornecedor selecionado
  const handleFornecedorChange = (e) => {
    const fornecedorSelecionado = fornecedores.find(f => f.id === parseInt(e.target.value));
    setFormData(prev => ({
      ...prev,
      fornecedor: e.target.value
    }));

    // Limpar sugestões de produtos quando o fornecedor for alterado
    setSugestoesProdutos([]);
    setCampoProdutoAtivo(null);

    // NÃO aplicar dados automaticamente - deixar o usuário escolher o conjunto de tributação
  };

  // Aplicar dados do conjunto de tributos selecionado
  const handleTributoChange = (index, tributoId) => {
    console.log('handleTributoChange chamado:', { index, tributoId, fornecedor: formData.fornecedor });
    
    // Primeiro, salvar o tributo selecionado
    handleItemChange(index, 'tributoSelecionado', tributoId);
    
    if (!formData.fornecedor) {
      console.log('Nenhum fornecedor selecionado');
      return;
    }

    const fornecedorSelecionado = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
    console.log('Fornecedor selecionado:', fornecedorSelecionado);
    
    if (!fornecedorSelecionado) {
      console.log('Fornecedor não encontrado');
      return;
    }

    // Se "nenhum" for selecionado, zerar os valores
    if (tributoId === 'nenhum') {
      console.log('Aplicando valores zerados');
      handleItemChange(index, 'frete', 0);
      handleItemChange(index, 'ipi', 0);
      handleItemChange(index, 'desconto', '');
      return;
    }

    // Se "personalizado" for selecionado, não aplicar valores automaticamente
    if (tributoId === 'personalizado') {
      console.log('Modo personalizado selecionado - permitir edição manual');
      return;
    }

    console.log('Tributos disponíveis:', fornecedorSelecionado.tributosDescontos);
    const tributo = fornecedorSelecionado.tributosDescontos.find(t => String(t.id) === String(tributoId));
    console.log('Tributo encontrado:', tributo);
    
    if (!tributo) {
      console.log('Tributo não encontrado');
      return;
    }

    const novosDescontos = tributo.descontos.map(d => d.valor).join('+');
    console.log('Aplicando valores:', {
      frete: tributo.frete,
      ipi: tributo.ipi,
      descontos: novosDescontos
    });

    handleItemChange(index, 'frete', tributo.frete);
    handleItemChange(index, 'ipi', tributo.ipi);
    handleItemChange(index, 'desconto', novosDescontos);
  };

  const calcularCustoTotalSelecionados = () => {
    return formData.itens.reduce((total, item, index) => {
      if (itensSelecionados[index]) {
        const custoBruto = parseFloat(item.custoBruto) || 0;
        const quantidade = parseFloat(item.quantidade) || 0;
        return total + (custoBruto * quantidade);
      }
      return total;
    }, 0);
  };

  const calcularCustoLiquidoSelecionados = () => {
    return formData.itens.reduce((total, item, index) => {
      if (itensSelecionados[index]) {
        const custoBruto = parseFloat(item.custoBruto) || 0;
        const frete = parseFloat(item.frete) || 0;
        const ipi = parseFloat(item.ipi) || 0;
        const quantidade = parseFloat(item.quantidade) || 0;

        const valorFrete = custoBruto * (frete / 100);
        const valorIpi = (custoBruto + valorFrete) * (ipi / 100);
        
        let valorComDescontos = custoBruto + valorFrete + valorIpi;
        if (item.desconto && item.desconto !== '') {
          try {
            const descontos = item.desconto.split('+').map(d => parseFloat(d.trim()) / 100);
            descontos.forEach(desconto => {
              if (!isNaN(desconto)) {
                valorComDescontos = valorComDescontos * (1 - desconto);
              }
            });
          } catch (error) {
            console.error('Erro ao calcular descontos:', error);
          }
        }

        return total + (valorComDescontos * quantidade);
      }
      return total;
    }, 0);
  };


  useEffect(() => {
    // Adicionar o estilo global ao montar o componente
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);

    // Limpar o estilo ao desmontar o componente
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Função para calcular 45 dias úteis a partir de uma data
  const calcular45DiasUteis = (dataInicial) => {
    if (!dataInicial) return '';
    
    const data = new Date(dataInicial);
    let diasAdicionados = 0;
    let diasUteis = 0;
    
    while (diasUteis < 45) {
      data.setDate(data.getDate() + 1);
      diasAdicionados++;
      
      // Verificar se é dia útil (não é sábado nem domingo)
      const diaSemana = data.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasUteis++;
      }
    }
    
    return data.toISOString().split('T')[0];
  };

  // Função para definir data de hoje
  const definirDataHoje = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      dataVenda: hoje,
      prazoFinal: calcular45DiasUteis(hoje)
    }));
  };

  // Função para definir data da encomenda como hoje
  const definirDataEncomendaHoje = () => {
    const hoje = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      dataEncomenda: hoje
    }));
  };

  // Event listeners para fechar sugestões
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Se clicar fora de qualquer campo de produto, fechar sugestões
      if (!event.target.closest('.campo-produto')) {
        setSugestoesProdutos([]);
        setCampoProdutoAtivo(null);
      }
    };

    const handleKeyDown = (event) => {
      // Se pressionar ESC, fechar sugestões
      if (event.key === 'Escape') {
        setSugestoesProdutos([]);
        setCampoProdutoAtivo(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Limpar sugestões quando o campo ativo mudar
  useEffect(() => {
    // Se não há campo ativo, limpar sugestões
    if (campoProdutoAtivo === null) {
      setSugestoesProdutos([]);
    }
  }, [campoProdutoAtivo]);

  return (
    <div className="w-full px-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Link
            to="/ordens-compra"
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            {formData.tipo === 'cliente' && formData.oc 
              ? `Ordem de Compra Cliente ${formData.oc}`
              : formData.tipo === 'estoque' && formData.oc
              ? `Ordem de Compra Estoque ${formData.oc}`
              : formData.tipo === 'assistencia' && formData.oc
              ? `Ordem de Compra Assistência ${formData.oc}`
              : formData.tipo === 'cliente'
              ? 'Nova Ordem de Compra Cliente'
              : formData.tipo === 'estoque'
              ? 'Nova Ordem de Compra Estoque'
              : formData.tipo === 'assistencia'
              ? 'Nova Ordem de Compra Assistência'
              : 'Nova Ordem de Compra'}
          </h1>
          {(formData.tipo === 'cliente' || formData.tipo === 'estoque') && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(formData.status)}`}>
                {getStatusLabel(formData.status)}
              </span>
              {hasChanges && (
                <button
                  onClick={() => setShowChangesAlert(true)}
                  className="text-red-500 hover:text-red-600"
                  title="Clique para ver as alterações"
                >
                  <FaExclamationCircle />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Tipo quando nenhum tipo estiver selecionado */}
      {!formData.tipo && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Selecione o tipo de Ordem de Compra</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                const proximaOC = buscarProximaOC('cliente');
                setFormData(prev => ({
                  ...prev,
                  tipo: 'cliente',
                  oc: proximaOC,
                  status: 'aberto'
                }));
                setNextOC(proximaOC);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors"
            >
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-semibold mb-2">Cliente</h3>
              <p className="text-blue-100">Ordem de compra vinculada a um pedido de venda</p>
            </button>
            
            <button
              onClick={() => {
                const proximaOC = buscarProximaOC('estoque');
                setFormData(prev => ({
                  ...prev,
                  tipo: 'estoque',
                  oc: proximaOC,
                  status: 'aberto'
                }));
                setNextOCEstoque(proximaOC);
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-xl font-semibold mb-2">Estoque</h3>
              <p className="text-green-100">Ordem de compra para reposição de estoque</p>
            </button>
            
            <button
              onClick={() => {
                const proximaOC = buscarProximaOC('assistencia');
                setFormData(prev => ({
                  ...prev,
                  tipo: 'assistencia',
                  oc: proximaOC,
                  status: 'aberto'
                }));
                setNextOCAssistencia(proximaOC);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors"
            >
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Assistência</h3>
              <p className="text-purple-100">Ordem de compra para serviços de assistência técnica</p>
            </button>
          </div>
        </div>
      )}

      {/* Formulários só aparecem quando um tipo for selecionado */}
      {formData.tipo && (
        <div className="bg-white rounded-lg shadow-md p-4">
          {/* Seção 2 - Formulário de Cliente */}
          {formData.tipo === 'cliente' && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Informações Iniciais</h2>
                
                <>
                {/* Primeira linha: N. do Ped, OC e Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N. do Ped:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="pedidoVinculado"
                        value={formData.pedidoVinculado}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleBuscarPedido}
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Buscar pedido"
                      >
                        <FaSearch />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OC:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="oc"
                        value={formData.oc}
                        onChange={handleOCChange}
                        onBlur={handleOCBlur}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleGerarOC}
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Gerar próxima OC"
                      >
                        <FaBolt />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="aberto">Em aberto</option>
                      <option value="encomendado">Encomendado</option>
                    </select>
                  </div>
                </div>

                {/* Segunda linha: Data da Venda, Data da Encomenda e Prazo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Venda:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="dataVenda"
                        value={formData.dataVenda}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={definirDataHoje}
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Definir data de hoje"
                      >
                        <FaCalendarAlt />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Encomenda:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="dataEncomenda"
                        value={formData.dataEncomenda}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={definirDataEncomendaHoje}
                        className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
                        title="Definir data de hoje"
                      >
                        <FaCalendarAlt />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo:</label>
                    <input
                      type="date"
                      name="prazoFinal"
                      value={formData.prazoFinal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                </div>

                {/* Terceira linha: Vendedor e Fábrica (metade do tamanho) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor:</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="vendedor"
                        value={formData.vendedor}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, vendedor: value }));
                          
                          // Mostrar sugestões apenas para colaboradores ativos
                          if (value.length > 0) {
                            const sugestoes = colaboradores
                              .filter(c => c.status === 'Ativo' && 
                                c.nome && c.nome.toLowerCase().includes(value.toLowerCase()))
                              .slice(0, 10); // Limitar a 10 sugestões
                            setSugestoesVendedores(sugestoes);
                          } else {
                            setSugestoesVendedores([]);
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value.length > 0) {
                            const sugestoes = colaboradores
                              .filter(c => c.status === 'Ativo' && 
                                c.nome && c.nome.toLowerCase().includes(e.target.value.toLowerCase()))
                              .slice(0, 10);
                            setSugestoesVendedores(sugestoes);
                          }
                        }}
                        onBlur={() => {
                          // Aguardar mais tempo para permitir cliques nas sugestões
                          setTimeout(() => {
                            if (campoProdutoAtivo === index) {
                              setSugestoesProdutos([]);
                              setCampoProdutoAtivo(null);
                            }
                          }, 300);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite para buscar vendedores..."
                      />
                      {sugestoesVendedores && sugestoesVendedores.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {sugestoesVendedores.map((colaborador, idx) => (
                            <div
                              key={colaborador.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  vendedor: colaborador.nome
                                }));
                                setSugestoesVendedores([]);
                              }}
                            >
                              <div className="font-medium">{colaborador.nome}</div>
                              {colaborador.cargo && (
                                <div className="text-xs text-gray-500">{colaborador.cargo}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fábrica:</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fabrica"
                        value={formData.fabrica}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, fabrica: value }));
                          
                          // Limpar sugestões de produtos quando a fábrica for alterada
                          setSugestoesProdutos([]);
                          setCampoProdutoAtivo(null);
                          
                          // Mostrar sugestões apenas para fornecedores ativos
                          if (value.length > 0) {
                            const sugestoes = fornecedores
                              .filter(f => f.status === 'Ativo' && 
                                f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(value.toLowerCase()))
                              .slice(0, 10); // Limitar a 10 sugestões
                            setSugestoesFabricas(sugestoes);
                          } else {
                            setSugestoesFabricas([]);
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value.length > 0) {
                            const sugestoes = fornecedores
                              .filter(f => f.status === 'Ativo' && 
                                f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(e.target.value.toLowerCase()))
                              .slice(0, 10);
                            setSugestoesFabricas(sugestoes);
                          }
                        }}
                        onBlur={() => {
                          // Aguardar mais tempo para permitir cliques nas sugestões
                          setTimeout(() => {
                            if (campoProdutoAtivo === index) {
                              setSugestoesProdutos([]);
                              setCampoProdutoAtivo(null);
                            }
                          }, 300);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite para buscar fábricas..."
                      />
                      {sugestoesFabricas && sugestoesFabricas.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {sugestoesFabricas.map((fornecedor, idx) => (
                            <div
                              key={fornecedor.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  fabrica: fornecedor.nomeFantasia
                                }));
                                setSugestoesFabricas([]);
                              }}
                            >
                              <div className="font-medium">{fornecedor.nomeFantasia}</div>
                              {fornecedor.razaoSocial && fornecedor.razaoSocial !== fornecedor.nomeFantasia && (
                                <div className="text-xs text-gray-500">{fornecedor.razaoSocial}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                                  </div>
                    </>
                  </div>

              {/* Linha divisória */}
              <hr className="border-gray-300 my-8" />

              {/* Seção 3 - Dados Pós Recebimento */}
              <div className="mb-8">
                <div 
                  className="flex items-center gap-3 cursor-pointer mb-4"
                  onClick={() => setDadosPosRecebimentoExpanded(!dadosPosRecebimentoExpanded)}
                >
                  <h2 className="text-xl font-semibold text-gray-700">Dados Pós Recebimento</h2>
                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    {dadosPosRecebimentoExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
                
                {dadosPosRecebimentoExpanded && (
                  <div className="space-y-6">
                    {/* ENTRADAS */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-700">ENTRADAS</h3>
                        <button
                          onClick={handleAddEntrada}
                          className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                          title="Adicionar entrada"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.entradas && formData.entradas.map((entrada, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              entrada.salvo 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {entrada.editando ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Entrada</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="date"
                                        value={entrada.dataEntrada || ''}
                                        onChange={(e) => handleEntradaChange(index, 'dataEntrada', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleEntradaChange(index, 'dataEntrada', new Date().toISOString().split('T')[0])}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                                        title="Definir data atual"
                                      >
                                        <FaCalendarAlt className="text-sm" />
                                        Hoje
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DOC FAB</label>
                                    <input
                                      type="text"
                                      placeholder="Documento da fábrica"
                                      value={entrada.documentoFabrica || ''}
                                      onChange={(e) => handleEntradaChange(index, 'documentoFabrica', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data DOC (Emissão)</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="date"
                                        value={entrada.dataDocumento || ''}
                                        onChange={(e) => handleEntradaChange(index, 'dataDocumento', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleEntradaChange(index, 'dataDocumento', new Date().toISOString().split('T')[0])}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                                        title="Definir data atual"
                                      >
                                        <FaCalendarAlt className="text-sm" />
                                        Hoje
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                  <textarea
                                    placeholder="Observações..."
                                    value={entrada.observacao || ''}
                                    onChange={(e) => handleEntradaChange(index, 'observacao', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditarEntrada(index)}
                                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Editar"
                                    >
                                      <FaInfoCircle />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveEntrada(index)}
                                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                      title="Deletar"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleSalvarEntrada(index)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Data Entrada:</span>
                                    <p className="text-gray-600">{entrada.dataEntrada || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">DOC FAB:</span>
                                    <p className="text-gray-600">{entrada.documentoFabrica || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Data DOC:</span>
                                    <p className="text-gray-600">{entrada.dataDocumento || '-'}</p>
                                  </div>
                                </div>
                                {entrada.observacao && (
                                  <div>
                                    <span className="font-medium text-gray-700">Observações:</span>
                                    <p className="text-gray-600">{entrada.observacao}</p>
                                  </div>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    onClick={() => handleEditarEntrada(index)}
                                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Editar"
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveEntrada(index)}
                                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                    title="Deletar"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DATA ENTREGA CLIENTE */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-700">DATA ENTREGA CLIENTE</h3>
                        <button
                          onClick={handleAddDataEntrega}
                          className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                          title="Adicionar entrega"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.datasEntrega && formData.datasEntrega.map((entrega, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              entrega.salvo 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {entrega.editando ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Entrega</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="date"
                                        value={entrega.data || ''}
                                        onChange={(e) => handleDataEntregaChange(index, 'data', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleDataEntregaChange(index, 'data', new Date().toISOString().split('T')[0])}
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
                                      placeholder="Observações..."
                                      value={entrega.observacao || ''}
                                      onChange={(e) => handleDataEntregaChange(index, 'observacao', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows="2"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditarDataEntrega(index)}
                                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Editar"
                                    >
                                      <FaInfoCircle />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveDataEntrega(index)}
                                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                      title="Deletar"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleSalvarDataEntrega(index)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Data Entrega:</span>
                                    <p className="text-gray-600">{entrega.data || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Observações:</span>
                                    <p className="text-gray-600">{entrega.observacao || '-'}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    onClick={() => handleEditarDataEntrega(index)}
                                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Editar"
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveDataEntrega(index)}
                                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                    title="Deletar"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Linha divisória */}
              <hr className="border-gray-300 my-8" />

                            {/* Seção 4 - Itens da Ordem */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Itens da Ordem</h2>
                  <button
                    onClick={handleAddItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaPlus />
                    Adicionar Item
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '6%'}}>
                          N.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '8%'}}>
                          Qtd.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '40%'}}>
                          Descrição
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Bruto Unit.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Líq. Unit.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Líq. Total
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.itens.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <input
                                type="number"
                                value={item.quantidade || ''}
                                onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value))}
                                className="w-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white hover:bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.descricao || ''}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  handleItemChange(index, 'descricao', valor);
                                  // Buscar produtos automaticamente enquanto digita
                                  if (valor.length >= 2) {
                                    handleBuscarProduto(valor, index);
                                  } else {
                                    setSugestoesProdutos([]);
                                    setCampoProdutoAtivo(null);
                                  }
                                }}
                                onFocus={() => {
                                  // Se já há texto no campo, mostrar sugestões imediatamente
                                  if (item.descricao && item.descricao.length >= 2) {
                                    handleBuscarProduto(item.descricao, index);
                                  }
                                }}
                                onBlur={() => {
                                  // Aguardar um pouco para permitir cliques nas sugestões
                                  setTimeout(() => {
                                    if (campoProdutoAtivo === index) {
                                      setSugestoesProdutos([]);
                                      setCampoProdutoAtivo(null);
                                    }
                                  }, 200);
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white campo-produto"
                                placeholder={formData.fabrica ? "Digite para buscar produtos..." : "Selecione uma fábrica primeiro..."}
                                disabled={!formData.fabrica}
                              />
                              {sugestoesProdutos.length > 0 && campoProdutoAtivo === index && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {sugestoesProdutos.map((produto, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelecionarProduto(produto, index);
                                      }}
                                    >
                                      <div className="font-medium">{produto.descricao}</div>
                                      <div className="text-gray-600">Custo: R$ {produto.custoBruto?.toFixed(2) || '0.00'}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.custoBruto || ''}
                                onChange={(e) => handleItemChange(index, 'custoBruto', parseFloat(e.target.value))}
                                className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <p className="text-sm">
                                {calcularCustoLiquidoUnitario(item) === '-' ? '-' : `R$ ${calcularCustoLiquidoUnitario(item).toFixed(2)}`}
                              </p>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <p className="text-sm font-semibold">
                                {calcularCustoLiquidoItem(item) === '-' ? '-' : `R$ ${calcularCustoLiquidoItem(item).toFixed(2)}`}
                              </p>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {itensEnviados[index]?.enviado ? (
                                  <button
                                    onClick={() => setShowObservacaoPopup(index)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                    title={`Enviado em: ${new Date(itensEnviados[index].dataEnvio).toLocaleString('pt-BR')}`}
                                  >
                                    <FaCheck />
                                  </button>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={itensSelecionados[index] || false}
                                    onChange={() => handleSelecionarItem(index)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                )}
                                <button
                                  onClick={() => toggleExpandItem(index)}
                                  className="p-1 text-gray-600 hover:text-gray-800"
                                >
                                  {expandedItems[index] ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                                <button
                                  onClick={() => handleObservacaoClick(index)}
                                  className={`p-1 ${item.observacoes ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-800`}
                                >
                                  <FaInfoCircle />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(index)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedItems[index] && (
                            <tr>
                              <td colSpan="7" className="px-2 py-1 bg-gray-50">
                                <div className="grid grid-cols-5 gap-1">
                                  {/* Conjunto de Tributos */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Conjunto de Tributos</label>
                                    <select
                                      value={item.tributoSelecionado || ''}
                                      onChange={(e) => handleTributoChange(index, e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="nenhum">Nenhum</option>
                                      <option value="personalizado">Personalizado</option>
                                      {tributosDisponiveis.map(tributo => (
                                        <option key={tributo.id} value={String(tributo.id)}>
                                          {tributo.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Frete (%)</label>
                                    <input
                                      type="text"
                                      value={item.frete || ''}
                                      onChange={(e) => handleItemChange(index, 'frete', e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">IPI (%)</label>
                                    <input
                                      type="text"
                                      value={item.ipi || ''}
                                      onChange={(e) => handleItemChange(index, 'ipi', e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Desconto (%)</label>
                                    <input
                                      type="text"
                                      value={item.desconto || ''}
                                      onChange={(e) => handleItemChange(index, 'desconto', e.target.value)}
                                      placeholder="Ex: 5+3+2"
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separe os descontos com "+"</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                                        </tbody>
                  </table>
                  </div>
                </div>

              {/* Totais */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Bruto Total</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {calcularCustoTotal().toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Líquido Total</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {calcularCustoLiquido().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Totais dos itens selecionados */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Bruto Total (Selecionados)</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {calcularCustoTotalSelecionados().toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Líquido Total (Selecionados)</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {calcularCustoLiquidoSelecionados().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Linha divisória */}
              <hr className="border-gray-300 my-8" />

                            {/* Seção 4 - Observações */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Observações</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                    <textarea
                      name="observacoesInternas"
                      value={formData.observacoesInternas}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleImprimir}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <FaPrint />
                  Imprimir
                </button>
                <button
                  onClick={handleSalvar}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    formData.salvo 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  {formData.salvo ? <FaCheck /> : <FaSave />}
                  {formData.salvo ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              {formData.enviado && formData.dataEnvio && (
                <div className="mt-4 text-sm text-gray-600">
                  Enviado em: {new Date(formData.dataEnvio).toLocaleString('pt-BR')}
                </div>
              )}
            </>
          )}

          {/* Seção 2 - Formulário de Estoque */}
          {formData.tipo === 'estoque' && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Informações Iniciais</h2>
                
                {/* Primeira linha: Data Encomenda, Status e Prazo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Encomenda:</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="dataEncomenda"
                        value={formData.dataEncomenda}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={definirDataEncomendaHoje}
                        className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
                        title="Definir data de hoje"
                      >
                        <FaCalendarAlt />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="aberto">Em aberto</option>
                      <option value="encomendado">Encomendado</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo:</label>
                    <input
                      type="date"
                      name="prazoFinal"
                      value={formData.prazoFinal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Segunda linha: OC e Fornecedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OC</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="oc"
                        value={formData.oc}
                        onChange={handleOCChange}
                        onBlur={handleOCBlur}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleGerarOC}
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Gerar próxima OC"
                      >
                        <FaBolt />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      name="fornecedor"
                      value={(() => {
                        // Se há um fornecedor selecionado, mostrar o nome
                        if (formData.fornecedor) {
                          const f = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
                          return f ? f.nomeFantasia : formData.fornecedorNome || '';
                        }
                        // Se não há fornecedor selecionado, mostrar o nome digitado
                        return formData.fornecedorNome || '';
                      })()}
                      onChange={e => {
                        console.log('Digitando fornecedor:', e.target.value);
                        console.log('Fornecedores disponíveis:', fornecedores);
                        
                        // Atualizar o nome digitado no formData
                        setFormData(prev => ({
                          ...prev,
                          fornecedorNome: e.target.value,
                          fornecedor: '' // Limpar o ID do fornecedor quando digitar
                        }));
                        
                        // Mostrar sugestões
                        if (e.target.value.length > 0) {
                          const sugestoes = fornecedores.filter(f => f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(e.target.value.toLowerCase()));
                          console.log('Sugestões encontradas:', sugestoes);
                          setSugestoesFornecedores(sugestoes);
                        } else {
                          setSugestoesFornecedores([]);
                        }
                      }}
                      onFocus={e => {
                        if (e.target.value.length > 0) {
                          const sugestoes = fornecedores.filter(f => f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(e.target.value.toLowerCase()));
                          setSugestoesFornecedores(sugestoes);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite para buscar fornecedores..."
                    />
                    {sugestoesFornecedores && sugestoesFornecedores.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {sugestoesFornecedores.map((fornecedor, idx) => (
                          <div
                            key={fornecedor.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              console.log('Fornecedor selecionado:', fornecedor);
                              setFormData(prev => ({ 
                                ...prev, 
                                fornecedor: fornecedor.id.toString(),
                                fornecedorNome: fornecedor.nomeFantasia
                              }));
                              setSugestoesFornecedores([]);
                              // Limpar sugestões de produtos quando o fornecedor for alterado
                              setSugestoesProdutos([]);
                              setCampoProdutoAtivo(null);
                            }}
                          >
                            <div className="font-medium">{fornecedor.nomeFantasia}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                                    {/* Seção 3 - Itens da Ordem */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Itens da Ordem</h2>
                  <button
                    onClick={handleAddItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaPlus />
                    Adicionar Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '6%'}}>
                          N.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '8%'}}>
                          Qtd.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '40%'}}>
                          Descrição
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Bruto Unit.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Líq. Unit.
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Custo Líq. Total
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '11.5%'}}>
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.itens.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-center">
                              <input
                                type="number"
                                value={item.quantidade || ''}
                                onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value))}
                                className="w-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white hover:bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap relative">
                              <input
                                type="text"
                                value={item.descricao || ''}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  handleItemChange(index, 'descricao', valor);
                                  // Buscar produtos automaticamente enquanto digita
                                  if (valor.length >= 2) {
                                    handleBuscarProduto(valor, index);
                                  } else {
                                    setSugestoesProdutos([]);
                                    setCampoProdutoAtivo(null);
                                  }
                                }}
                                onFocus={() => {
                                  // Se já há texto no campo, mostrar sugestões imediatamente
                                  if (item.descricao && item.descricao.length >= 2) {
                                    handleBuscarProduto(item.descricao, index);
                                  }
                                }}
                                onBlur={() => {
                                  // Aguardar um pouco para permitir cliques nas sugestões
                                  setTimeout(() => {
                                    if (campoProdutoAtivo === index) {
                                      setSugestoesProdutos([]);
                                      setCampoProdutoAtivo(null);
                                    }
                                  }, 200);
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white campo-produto"
                                placeholder={formData.fornecedor ? "Digite para buscar produtos..." : "Selecione um fornecedor primeiro..."}
                                disabled={!formData.fornecedor}
                              />
                              {sugestoesProdutos.length > 0 && campoProdutoAtivo === index && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {sugestoesProdutos.map((produto, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelecionarProduto(produto, index);
                                      }}
                                    >
                                      <div className="font-medium">{produto.descricao}</div>
                                      <div className="text-gray-600">Custo: R$ {produto.custoBruto?.toFixed(2) || '0.00'}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <input
                                type="text"
                                value={item.custoBruto || ''}
                                onChange={(e) => handleItemChange(index, 'custoBruto', parseFloat(e.target.value))}
                                className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <p className="text-sm">
                                {calcularCustoLiquidoUnitario(item) === '-' ? '-' : `R$ ${calcularCustoLiquidoUnitario(item).toFixed(2)}`}
                              </p>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <p className="text-sm font-semibold">
                                {calcularCustoLiquidoItem(item) === '-' ? '-' : `R$ ${calcularCustoLiquidoItem(item).toFixed(2)}`}
                              </p>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleExpandItem(index)}
                                  className="p-1 text-gray-600 hover:text-gray-800"
                                >
                                  {expandedItems[index] ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                                <button
                                  onClick={() => handleObservacaoClick(index)}
                                  className={`p-1 ${item.observacoes ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-800`}
                                >
                                  <FaInfoCircle />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(index)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedItems[index] && (
                            <tr>
                              <td colSpan="7" className="px-2 py-1 bg-gray-50">
                                <div className="grid grid-cols-5 gap-1">
                                  {/* Conjunto de Tributos */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Conjunto de Tributos</label>
                                    <select
                                      value={item.tributoSelecionado || ''}
                                      onChange={(e) => handleTributoChange(index, e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="nenhum">Nenhum</option>
                                      <option value="personalizado">Personalizado</option>
                                      {tributosDisponiveis.map(tributo => (
                                        <option key={tributo.id} value={String(tributo.id)}>
                                          {tributo.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Frete (%)</label>
                                    <input
                                      type="text"
                                      value={item.frete || ''}
                                      onChange={(e) => handleItemChange(index, 'frete', e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">IPI (%)</label>
                                    <input
                                      type="text"
                                      value={item.ipi || ''}
                                      onChange={(e) => handleItemChange(index, 'ipi', e.target.value)}
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700">Desconto (%)</label>
                                    <input
                                      type="text"
                                      value={item.desconto || ''}
                                      onChange={(e) => handleItemChange(index, 'desconto', e.target.value)}
                                      placeholder="Ex: 5+3+2"
                                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      disabled={item.tributoSelecionado && item.tributoSelecionado !== 'nenhum' && item.tributoSelecionado !== 'personalizado'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separe os descontos com "+"</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Bruto Total</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {calcularCustoTotal().toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Líquido Total</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {calcularCustoLiquido().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Totais dos itens selecionados */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Bruto Total (Selecionados)</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {calcularCustoTotalSelecionados().toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Custo Líquido Total (Selecionados)</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {calcularCustoLiquidoSelecionados().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Linha divisória */}
              <hr className="border-gray-300 my-8" />

              {/* Seção 4 - Observações */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Observações</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                    <textarea
                      name="observacoesInternas"
                      value={formData.observacoesInternas}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleImprimir}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <FaPrint />
                  Imprimir
                </button>
                <button
                  onClick={handleSalvar}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    formData.salvo 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  {formData.salvo ? <FaCheck /> : <FaSave />}
                  {formData.salvo ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              {formData.enviado && formData.dataEnvio && (
                <div className="mt-4 text-sm text-gray-600">
                  Enviado em: {new Date(formData.dataEnvio).toLocaleString('pt-BR')}
                </div>
              )}
            </>
          )}

          {/* Seção 3 - Formulário de Assistência */}
          {formData.tipo === 'assistencia' && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Informações Iniciais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OC</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="oc"
                        value={formData.oc}
                        onChange={handleOCChange}
                        onBlur={handleOCBlur}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleGerarOC}
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Gerar próxima OC"
                      >
                        <FaBolt />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      name="fornecedor"
                      value={(() => {
                        // Se há um fornecedor selecionado, mostrar o nome
                        if (formData.fornecedor) {
                          const f = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
                          return f ? f.nomeFantasia : formData.fornecedorNome || '';
                        }
                        // Se não há fornecedor selecionado, mostrar o nome digitado
                        return formData.fornecedorNome || '';
                      })()}
                      onChange={e => {
                        console.log('Digitando fornecedor:', e.target.value);
                        console.log('Fornecedores disponíveis:', fornecedores);
                        
                        // Atualizar o nome digitado no formData
                        setFormData(prev => ({
                          ...prev,
                          fornecedorNome: e.target.value,
                          fornecedor: '' // Limpar o ID do fornecedor quando digitar
                        }));
                        
                        // Mostrar sugestões
                        if (e.target.value.length > 0) {
                          const sugestoes = fornecedores.filter(f => f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(e.target.value.toLowerCase()));
                          console.log('Sugestões encontradas:', sugestoes);
                          setSugestoesFornecedores(sugestoes);
                        } else {
                          setSugestoesFornecedores([]);
                        }
                      }}
                      onFocus={e => {
                        if (e.target.value.length > 0) {
                          const sugestoes = fornecedores.filter(f => f.nomeFantasia && f.nomeFantasia.toLowerCase().includes(e.target.value.toLowerCase()));
                          setSugestoesFornecedores(sugestoes);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite para buscar fornecedores..."
                    />
                    {sugestoesFornecedores && sugestoesFornecedores.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {sugestoesFornecedores.map((fornecedor, idx) => (
                          <div
                            key={fornecedor.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              console.log('Fornecedor selecionado:', fornecedor);
                              setFormData(prev => ({ 
                                ...prev, 
                                fornecedor: fornecedor.id.toString(),
                                fornecedorNome: fornecedor.nomeFantasia
                              }));
                              setSugestoesFornecedores([]);
                              // Limpar sugestões de produtos quando o fornecedor for alterado
                              setSugestoesProdutos([]);
                              setCampoProdutoAtivo(null);
                            }}
                          >
                            <div className="font-medium">{fornecedor.nomeFantasia}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 4 - Observações */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Observações</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                    <textarea
                      name="observacoesInternas"
                      value={formData.observacoesInternas}
                      onChange={handleChange}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleImprimir}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <FaPrint />
                  Imprimir
                </button>
                <button
                  onClick={handleSalvar}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    formData.salvo 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {formData.salvo ? <FaCheck /> : <FaSave />}
                  {formData.salvo ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              {formData.enviado && formData.dataEnvio && (
                <div className="mt-4 text-sm text-gray-600">
                  Enviado em: {new Date(formData.dataEnvio).toLocaleString('pt-BR')}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Popup de Observações */}
      {showObservacaoPopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Observações</h3>
            <textarea
              value={formData.itens[showObservacaoPopup]?.observacoes || ''}
              onChange={(e) => handleObservacaoChange(showObservacaoPopup, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowObservacaoPopup(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Anexo */}
      {showAnexoPopup !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Anexar Documento</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
              <input type="file" className="w-full" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAnexoPopup(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAnexoPopup(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Anexar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Alterações */}
      {showChangesAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Alterações Detectadas</h3>
            <p className="mb-4">
              Esta ordem de compra possui alterações em relação ao pedido de venda original.
              As seguintes informações foram modificadas:
            </p>
            <ul className="list-disc list-inside mb-4">
              {getChanges().map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button
                onClick={() => setShowChangesAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Confirmação - Editar Entrada */}
      {showConfirmEditEntrada !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <FaInfoCircle className="text-blue-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-blue-600">Confirmar Edição</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Tem certeza que deseja editar esta entrada?
              <br />
              As alterações serão aplicadas imediatamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmEditEntrada(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmEditEntrada(showConfirmEditEntrada)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Confirmação - Deletar Entrada */}
      {showConfirmDeleteEntrada !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <FaExclamationCircle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Tem certeza que deseja excluir esta entrada?
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDeleteEntrada(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDeleteEntrada(showConfirmDeleteEntrada)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Confirmação - Editar Entrega */}
      {showConfirmEditEntrega !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <FaInfoCircle className="text-blue-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-blue-600">Confirmar Edição</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Tem certeza que deseja editar esta data de entrega?
              <br />
              As alterações serão aplicadas imediatamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmEditEntrega(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmEditEntrega(showConfirmEditEntrega)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Confirmação - Deletar Entrega */}
      {showConfirmDeleteEntrega !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <FaExclamationCircle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Tem certeza que deseja excluir esta data de entrega?
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDeleteEntrega(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDeleteEntrega(showConfirmDeleteEntrega)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de OC Duplicada */}
      {showDuplicateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <FaExclamationCircle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-red-600">OC Duplicada</h3>
            </div>
            <p className="mb-6 text-gray-700">
              O número de OC <strong>{duplicateOC}</strong> já existe no sistema.
              <br />
              Deseja prosseguir mesmo assim?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarOCDuplicada}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Não
              </button>
              <button
                onClick={confirmarOCDuplicada}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaOrdemCompra;