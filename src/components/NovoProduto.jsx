import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRandom, FaDollarSign, FaBoxes } from 'react-icons/fa';

const MARKUP_STORAGE_KEY = 'markups_cadastrados';

// Componente para mostrar a disponibilidade do produto nos locais ativos
const DisponibilidadeProduto = ({ produtoId }) => {
  const [disponibilidade, setDisponibilidade] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDisponibilidade = () => {
      if (!produtoId) {
        setDisponibilidade([]);
        setLoading(false);
        return;
      }

      // Carregar locais ativos (apenas siglas, como no sistema de estoque)
      const locais = JSON.parse(localStorage.getItem('locais') || '[]');
      const locaisAtivos = locais
        .filter(local => local.status === 'Ativo')
        .map(local => local.sigla)
        .sort((a, b) => {
          if (a === 'DP') return -1;
          if (b === 'DP') return 1;
          return a.localeCompare(b);
        });

      // Carregar produto
      const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
      const produto = produtos.find(p => p.id === parseInt(produtoId));

      if (!produto) {
        setDisponibilidade([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Debug DisponibilidadeProduto:', {
        produtoId,
        produto: produto.descricao,
        estoque: produto.estoque,
        locaisAtivos
      });

      // Mapear disponibilidade por local usando a estrutura de estoque correta
      const disponibilidadePorLocal = locaisAtivos.map(sigla => {
        // Buscar quantidade na estrutura de estoque por local (sigla)
        const estoqueLocal = produto.estoque?.[sigla] || { quantidade: 0, observacao: '' };
        console.log(`📊 Local ${sigla}:`, estoqueLocal);
        return {
          local: sigla, // Usar a sigla como nome do local
          quantidade: estoqueLocal.quantidade || 0,
          sigla: sigla,
          observacao: estoqueLocal.observacao || ''
        };
      });

      setDisponibilidade(disponibilidadePorLocal);
      setLoading(false);
      
      console.log('✅ Disponibilidade carregada:', disponibilidadePorLocal);
    };

    carregarDisponibilidade();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'produtos_cadastrados' || e.key === 'historicoLancamentos') {
        carregarDisponibilidade();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Recarregar a cada 5 segundos para sincronização
    const interval = setInterval(carregarDisponibilidade, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [produtoId]);

  if (loading) {
    return <div className="text-gray-500">Carregando disponibilidade...</div>;
  }

  if (disponibilidade.length === 0) {
    return <div className="text-gray-500">Nenhum local ativo encontrado</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Disponibilidade por Local</h3>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              const carregarDisponibilidade = () => {
                if (!produtoId) {
                  setDisponibilidade([]);
                  setLoading(false);
                  return;
                }

                const locais = JSON.parse(localStorage.getItem('locais') || '[]');
                const locaisAtivos = locais
                  .filter(local => local.status === 'Ativo')
                  .map(local => local.sigla)
                  .sort((a, b) => {
                    if (a === 'DP') return -1;
                    if (b === 'DP') return 1;
                    return a.localeCompare(b);
                  });

                const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
                const produto = produtos.find(p => p.id === parseInt(produtoId));

                if (!produto) {
                  setDisponibilidade([]);
                  setLoading(false);
                  return;
                }

                const disponibilidadePorLocal = locaisAtivos.map(sigla => {
                  const estoqueLocal = produto.estoque?.[sigla] || { quantidade: 0, observacao: '' };
                  return {
                    local: sigla,
                    quantidade: estoqueLocal.quantidade || 0,
                    sigla: sigla,
                    observacao: estoqueLocal.observacao || ''
                  };
                });

                setDisponibilidade(disponibilidadePorLocal);
                setLoading(false);
              };
              carregarDisponibilidade();
            }, 100);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          🔄 Atualizar
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {disponibilidade.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.local}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.quantidade}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.observacao ? (
                  <span className="text-red-600" title={item.observacao}>
                    ⚠️ {item.observacao}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const NovoProduto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const produtoCarregadoRef = useRef(false);
  
  const [formData, setFormData] = useState({
    sku: '',
    descricao: '',
    estoqueMinimo: '',
    categoria: '',
    fornecedor: '',
    tributoSelecionado: '',
    custoBruto: '',
    descontos: '',
    frete: '',
    ipi: '',
    custoLiquido: '',
    markupSelecionado: '',
    tabc: '',
    localizacoes: [],
    observacoes: '',
    historicoLancamentos: [],
    estoqueDisponivel: 0,
    estoqueFisico: 0
  });

  const [fornecedores, setFornecedores] = useState([]);
  const [tributosDisponiveis, setTributosDisponiveis] = useState([]);
  const [markups, setMarkups] = useState([]);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Estados para modal de lançamento
  const [modalLancamento, setModalLancamento] = useState({
    isOpen: false,
    produto: null
  });

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

  // Resetar flag de carregamento quando o ID mudar
  useEffect(() => {
    produtoCarregadoRef.current = false;
    setIsEditing(false);
  }, [id]);

  // 1. Carregue Fornecedores Primeiramente
  useEffect(() => {
    const carregarDados = () => {
      const fornecedoresSalvos = JSON.parse(localStorage.getItem('fornecedores') || '[]');
      const fornecedoresAtivos = fornecedoresSalvos.filter(f => f.status === 'Ativo');
      const markupsSalvos = JSON.parse(localStorage.getItem(MARKUP_STORAGE_KEY) || '[]');
      
      setFornecedores(fornecedoresAtivos);
      setMarkups(markupsSalvos);
    };

    carregarDados();
    // Recarregar a cada 5 segundos para sincronização em tempo real
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Carregar produto quando fornecedores estiverem disponíveis
  useEffect(() => {
    if (!id || fornecedores.length === 0) {
      console.log('Aguardando fornecedores ou ID:', { id, fornecedoresLength: fornecedores.length });
      return;
    }

    // Evitar re-carregamento se já foi carregado
    if (produtoCarregadoRef.current) {
      console.log('Produto já foi carregado, evitando re-carregamento');
      return;
    }

    console.log('=== INICIANDO CARREGAMENTO DO PRODUTO ===');
    console.log('ID do produto:', id);
    console.log('Fornecedores carregados:', fornecedores.length);

    const produtosSalvos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
    console.log('Produtos salvos no localStorage:', produtosSalvos.length);
    
    const produto = produtosSalvos.find(p => p.id === parseInt(id));
    
    if (!produto) {
      console.log('❌ Produto não encontrado para o ID:', id);
      console.log('IDs disponíveis:', produtosSalvos.map(p => p.id));
      return;
    }

    console.log('✅ Produto encontrado:', produto);
    console.log('Fornecedor do produto:', produto.fornecedor);

    // Buscar fornecedor pelo nome fantasia (mais flexível)
    let fornecedor = fornecedores.find(f => f.nomeFantasia === produto.fornecedor);
    
    // Se não encontrar pelo nome exato, tentar buscar por similaridade
    if (!fornecedor) {
      console.log('🔍 Buscando fornecedor por similaridade...');
      fornecedor = fornecedores.find(f => 
        f.nomeFantasia.toLowerCase().includes(produto.fornecedor.toLowerCase()) ||
        produto.fornecedor.toLowerCase().includes(f.nomeFantasia.toLowerCase())
      );
    }

    // Se ainda não encontrar, usar o primeiro fornecedor disponível ou deixar vazio
    if (!fornecedor) {
      console.log('⚠️ Fornecedor não encontrado para:', produto.fornecedor);
      console.log('Fornecedores disponíveis:', fornecedores.map(f => f.nomeFantasia));
      console.log('Deixando campo fornecedor vazio');
    } else {
      console.log('✅ Fornecedor encontrado:', fornecedor.nomeFantasia, 'ID:', fornecedor.id);
    }

    const dadosFormulario = {
      sku: produto.sku || '',
      descricao: produto.descricao || '',
      estoqueMinimo: produto.estoqueMinimo || '',
      categoria: produto.categoria || '',
      fornecedor: fornecedor ? String(fornecedor.id) : '',
      tributoSelecionado: produto.tributoSelecionado ? String(produto.tributoSelecionado) : '',
      frete: produto.frete || '',
      ipi: produto.ipi || '',
      descontos: produto.descontos || '',
      custoBruto: produto.custoBruto !== undefined && produto.custoBruto !== null ? formatarMoeda(produto.custoBruto) : '',
      custoLiquido: produto.custoLiquido !== undefined && produto.custoLiquido !== null ? formatarMoeda(produto.custoLiquido) : '',
      markupSelecionado: produto.markupSelecionado || '',
      tabc: produto.tabc !== undefined && produto.tabc !== null ? formatarMoeda(produto.tabc) : '',
      localizacoes: produto.localizacoes || [],
      observacoes: produto.observacoes || '',
      historicoLancamentos: produto.historicoLancamentos || [],
      estoqueDisponivel: produto.estoqueDisponivel || 0,
      estoqueFisico: produto.estoqueFisico || 0
    };

    console.log('📝 Dados do formulário preparados:', dadosFormulario);
    
    setFormData(dadosFormulario);
    setIsEditing(true);
    produtoCarregadoRef.current = true;
    
    console.log('✅ Formulário carregado com dados do produto');
    console.log('=== FIM DO CARREGAMENTO ===');
  }, [id, fornecedores]);

  // 3. Carregar tributos disponíveis do fornecedor
  useEffect(() => {
    if (!formData.fornecedor) {
      setTributosDisponiveis([]);
      return;
    }

    const fornecedorSelecionado = fornecedores.find(f => String(f.id) === formData.fornecedor);
    if (fornecedorSelecionado) {
      setTributosDisponiveis(fornecedorSelecionado.tributosDescontos || []);
    }
  }, [formData.fornecedor, fornecedores]);

  // 4. Aplicar dados do conjunto de tributos selecionado
  useEffect(() => {
    if (!formData.tributoSelecionado || !formData.fornecedor) return;

    // Se "nenhum" for selecionado, zerar os valores
    if (formData.tributoSelecionado === 'nenhum') {
      setFormData(prev => ({
        ...prev,
        frete: '',
        ipi: '',
        descontos: ''
      }));
      return;
    }

    const fornecedorSelecionado = fornecedores.find(f => String(f.id) === formData.fornecedor);
    if (!fornecedorSelecionado) return;

    const tributo = fornecedorSelecionado.tributosDescontos.find(
      t => String(t.id) === formData.tributoSelecionado
    );
    if (!tributo) return;

    const novosDescontos = tributo.descontos.map(d => d.valor).join('+');

    setFormData(prev => {
      const precisaAtualizar =
        prev.frete !== tributo.frete ||
        prev.ipi !== tributo.ipi ||
        prev.descontos !== novosDescontos;

      if (!precisaAtualizar) return prev;

      return {
        ...prev,
        frete: tributo.frete,
        ipi: tributo.ipi,
        descontos: novosDescontos
      };
    });
  }, [formData.tributoSelecionado, formData.fornecedor, fornecedores]);

  // 5. Atualizar custo líquido sempre que os campos relacionados mudarem
  useEffect(() => {
    const novoCustoLiquido = calcularCustoLiquido(
      formData.custoBruto,
      formData.descontos,
      formData.frete,
      formData.ipi
    );
    
    setFormData(prev => ({
      ...prev,
      custoLiquido: novoCustoLiquido
    }));
  }, [formData.custoBruto, formData.descontos, formData.frete, formData.ipi]);

  // 6. Atualizar TABC quando o markup ou custo líquido mudar
  useEffect(() => {
    if (formData.markupSelecionado && formData.custoLiquido) {
      const markup = markups.find(m => m.id === parseInt(formData.markupSelecionado));
      if (markup) {
        const custoLiquido = converterParaNumero(formData.custoLiquido);
        const valorMarkup = parseFloat(markup.valor.replace('%', ''));
        const valorAdicional = custoLiquido * (valorMarkup / 100);
        const novoTABC = custoLiquido + valorAdicional;
        
        setFormData(prev => ({
          ...prev,
          tabc: formatarMoeda(novoTABC)
        }));
      }
    } else if (!formData.markupSelecionado) {
      setFormData(prev => ({
        ...prev,
        tabc: ''
      }));
    }
  }, [formData.markupSelecionado, formData.custoLiquido, markups]);

  // Funções auxiliares
  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return '';
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const converterParaNumero = (valor) => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.'));
  };

  const calcularCustoLiquido = (custoBruto, descontos, frete, ipi) => {
    let custo = converterParaNumero(custoBruto);
    
    // 1. Aplicar descontos primeiro (reduz o custo)
    if (descontos) {
      const descontosArray = descontos.split('+').map(d => converterParaNumero(d.trim()));
      descontosArray.forEach(desconto => {
        custo = custo * (1 - desconto / 100);
      });
    }

    // 2. Aplicar frete (adiciona ao custo)
    if (frete) {
      const valorFrete = converterParaNumero(frete);
      custo += custo * (valorFrete / 100);
    }

    // 3. Aplicar IPI (adiciona ao custo + frete)
    if (ipi) {
      const valorIpi = converterParaNumero(ipi);
      custo += custo * (valorIpi / 100);
    }

    return formatarMoeda(custo);
  };

  const gerarSKU = () => {
    const produtosAtuais = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
    const skusExistentes = produtosAtuais.map(p => p.sku);
    
    let sku;
    let tentativas = 0;
    const maxTentativas = 100;
    
    do {
      sku = Math.floor(100000000 + Math.random() * 900000000).toString();
      tentativas++;
      
      // Se estamos editando, não considerar o SKU atual do produto como duplicado
      if (isEditing && sku === formData.sku) {
        break;
      }
    } while (skusExistentes.includes(sku) && tentativas < maxTentativas);
    
    if (tentativas >= maxTentativas) {
      alert('Erro: Não foi possível gerar um SKU único após 100 tentativas. Tente novamente.');
      return;
    }
    
    setFormData(prev => ({ ...prev, sku }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'markupSelecionado') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    if (name === 'tabc' && formData.markupSelecionado) {
      return;
    }

    if (['custoBruto', 'tabc'].includes(name)) {
      const valorNumerico = value.replace(/[^\d,]/g, '');
      const partes = valorNumerico.split(',');
      const valorFormatado = partes.length > 1 
        ? partes[0] + ',' + partes.slice(1).join('')
        : valorNumerico;
      
      setFormData(prev => ({ ...prev, [name]: valorFormatado }));
      return;
    }

    if (['frete', 'ipi'].includes(name)) {
      const valorNumerico = value.replace(/[^\d,]/g, '');
      const partes = valorNumerico.split(',');
      const valorFormatado = partes.length > 1 
        ? partes[0] + ',' + partes.slice(1).join('')
        : valorNumerico;
      
      setFormData(prev => ({ ...prev, [name]: valorFormatado }));
      return;
    }

    if (name === 'descontos') {
      const valorNumerico = value.replace(/[^\d,+\s]/g, '');
      const partes = valorNumerico.split('+').map(parte => {
        const numeros = parte.trim().split(',');
        return numeros.length > 1 
          ? numeros[0] + ',' + numeros.slice(1).join('')
          : parte.trim();
      });
      const valorFormatado = partes.join('+');
      
      setFormData(prev => ({ ...prev, [name]: valorFormatado }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocalizacaoChange = (index, field, value) => {
    const newLocalizacoes = [...formData.localizacoes];
    newLocalizacoes[index][field] = value;
    setFormData(prev => ({ ...prev, localizacoes: newLocalizacoes }));
  };

  const handleAddLocalizacao = () => {
    setFormData(prev => ({
      ...prev,
      localizacoes: [...prev.localizacoes, { local: '', quantidade: '' }]
    }));
  };

  const handleRemoveLocalizacao = (index) => {
    setFormData(prev => ({
      ...prev,
      localizacoes: prev.localizacoes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação de SKU único
    const produtosAtuais = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
    const skuExistente = produtosAtuais.find(p => 
      p.sku === formData.sku && (!isEditing || p.id !== parseInt(id))
    );
    
    if (skuExistente) {
      alert(`Erro: O SKU "${formData.sku}" já está sendo usado pelo produto "${skuExistente.descricao}". Por favor, escolha um SKU único.`);
      return;
    }

    const fornecedorSelecionado = fornecedores.find(f => f.id === parseInt(formData.fornecedor));
    const nomeFornecedor = fornecedorSelecionado ? fornecedorSelecionado.nomeFantasia : '';

    const produtoData = {
      sku: formData.sku,
      descricao: formData.descricao,
      categoria: formData.categoria,
      fornecedor: nomeFornecedor,
      estoqueMinimo: formData.estoqueMinimo,
      tributoSelecionado: String(formData.tributoSelecionado),
      custoBruto: converterParaNumero(formData.custoBruto),
      descontos: formData.descontos,
      frete: formData.frete,
      ipi: formData.ipi,
      custoLiquido: converterParaNumero(formData.custoLiquido),
      markupSelecionado: formData.markupSelecionado,
      tabc: converterParaNumero(formData.tabc),
      localizacoes: formData.localizacoes,
      observacoes: formData.observacoes,
      historicoLancamentos: formData.historicoLancamentos,
      ...(isEditing && {
        estoqueDisponivel: formData.estoqueDisponivel || 0,
        estoqueFisico: formData.estoqueFisico || 0
      })
    };

    if (isEditing) {
      const produtosAtuais = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
      const produtosAtualizados = produtosAtuais.map(p => 
        p.id === parseInt(id) ? { ...p, ...produtoData } : p
      );
      localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
    } else {
      const produtosAtuais = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
      const novoId = Math.max(...produtosAtuais.map(p => p.id), 0) + 1;
      const novoProduto = { 
        ...produtoData, 
        id: novoId,
        estoqueDisponivel: 0,
        estoqueFisico: 0
      };
      produtosAtuais.push(novoProduto);
      localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtuais));
    }

    navigate('/produtos');
  };

  // Função para abrir modal de lançamento
  const abrirModalLancamento = () => {
    setModalLancamento({
      isOpen: true,
      produto: {
        id: parseInt(id),
        descricao: formData.descricao,
        sku: formData.sku,
        fornecedor: formData.fornecedor,
        tabc: formData.tabc
      }
    });
    setLancamentoData({
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tipo: 'Entrada',
      quantidade: '',
      observacao: '',
      local: 'DP',
      preco: formData.tabc ? converterParaNumero(formData.tabc).toFixed(2) : ''
    });
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
    const produtosAtuais = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
    const produtosAtualizados = produtosAtuais.map(produto => {
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

    localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosAtualizados));
    
    // Atualizar o estado local se estivermos editando o produto atual
    if (isEditing && parseInt(id) === modalLancamento.produto.id) {
      const produtoAtualizado = produtosAtualizados.find(p => p.id === parseInt(id));
      if (produtoAtualizado) {
        setFormData(prev => ({
          ...prev,
          estoqueDisponivel: produtoAtualizado.estoqueDisponivel,
          estoqueFisico: produtoAtualizado.estoqueFisico
        }));
      }
    }

    fecharModalLancamento();
    alert('Lançamento realizado com sucesso!');
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/produtos')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold ml-4">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
        {isEditing && (
          <button
            onClick={abrirModalLancamento}
            className="ml-auto flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FaBoxes className="mr-2" />
            Lançamento
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={gerarSKU}
                  className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                  title="Gerar SKU aleatório"
                >
                  <FaRandom />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
              <input
                type="number"
                name="estoqueMinimo"
                value={formData.estoqueMinimo}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <input
                type="text"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 md:w-1/2">
              <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
              <select
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione um fornecedor...</option>
                {fornecedores.map(fornecedor => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nomeFantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Custos e Preços */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaDollarSign className="text-blue-600" /> Custos e Preços
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custo Bruto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Custo Bruto</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  name="custoBruto"
                  value={formData.custoBruto}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Conjunto de Tributos */}
            {formData.fornecedor && tributosDisponiveis.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Conjunto de Tributos</label>
                <select
                  name="tributoSelecionado"
                  value={formData.tributoSelecionado}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecione um conjunto...</option>
                  <option value="nenhum">Nenhum</option>
                  {tributosDisponiveis.map(tributo => (
                    <option key={tributo.id} value={String(tributo.id)}>
                      {tributo.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grupo de Tributos */}
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tributos e Descontos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descontos (%)</label>
                  <input
                    type="text"
                    name="descontos"
                    value={formData.descontos}
                    onChange={handleChange}
                    placeholder="Ex: 5,5+3,2+2,1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={formData.tributoSelecionado && formData.tributoSelecionado !== 'nenhum'}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separe os valores com "+" (ex: 5,5+3,2+2,1)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Frete (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="frete"
                      value={formData.frete}
                      onChange={handleChange}
                      className="pr-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0,0"
                      disabled={formData.tributoSelecionado && formData.tributoSelecionado !== 'nenhum'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">IPI (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="ipi"
                      value={formData.ipi}
                      onChange={handleChange}
                      className="pr-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0,0"
                      disabled={formData.tributoSelecionado && formData.tributoSelecionado !== 'nenhum'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custo Líquido, Markup e TABC */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Custo Líquido</label>
              <input
                type="text"
                value={formData.custoLiquido}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Markup</label>
                <select
                  name="markupSelecionado"
                  value={formData.markupSelecionado}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecione um markup...</option>
                  {markups.map(markup => (
                    <option key={markup.id} value={markup.id}>
                      {markup.titulo} ({markup.valor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">TABC</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    name="tabc"
                    value={formData.tabc}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={!!formData.markupSelecionado}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Disponibilidade</h2>
          <DisponibilidadeProduto produtoId={id} />
        </div>

        {/* Observações */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Observações</h2>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="4"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/produtos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>

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
                ×
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

export default NovoProduto;
