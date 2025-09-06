import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTrash, FaPlus, FaTable, FaBook, FaBell, FaDollarSign, FaPencilAlt, FaPhone, FaEdit } from 'react-icons/fa';

function NovoFornecedor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(!!id);
  
  // Estado unificado do formulário
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    representante: '',
    emailEncomendas: '',
    emailAssistencia: '',
    contatos: [],
    tributosDescontos: [], // Novo array para armazenar conjuntos de tributos e descontos
    tributoTemp: { // Estado temporário para o formulário de tributos
      nome: '',
      frete: '',
      ipi: '',
      descontos: [],
      descontoTemp: {
        nome: '',
        valor: '',
        observacao: ''
      },
      apenasMarkup: false, // Indica se é apenas markup (sem frete, IPI e descontos)
      idOriginal: null // Para manter referência quando editando
    },
    prazoEntrega: '',
    transportadora: '',
    observacoes: '',
    status: 'Ativo'
  });

  // Estado para o formulário de contato
  const [novoContato, setNovoContato] = useState({
    nome: '',
    setor: '',
    telefone: '',
    email: ''
  });

  // Estado para controlar a visibilidade do formulário de tributos
  const [showTributoForm, setShowTributoForm] = useState(false);

  // Carregar dados do fornecedor se estiver editando
  useEffect(() => {
    if (!id) return;

    const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
    const fornecedor = fornecedores.find(f => f.id === parseInt(id));
    
    if (fornecedor) {
      // Garantir que os tributos e descontos sejam carregados corretamente
      const tributosFormatados = Array.isArray(fornecedor.tributosDescontos) 
        ? fornecedor.tributosDescontos.map(tributo => ({
            ...tributo,
            frete: tributo.frete.toString(),
            ipi: tributo.ipi.toString(),
            descontos: Array.isArray(tributo.descontos) 
              ? tributo.descontos.map(desconto => ({
                  id: desconto.id,
                  valor: desconto.valor.toString(),
                  observacao: desconto.observacao || ''
                }))
              : []
          }))
        : [];

      setFormData({
        ...fornecedor,
        tributosDescontos: tributosFormatados,
        tributoTemp: { 
          nome: '', 
          frete: '', 
          ipi: '', 
          descontos: [], 
          descontoTemp: { valor: '', observacao: '' },
          apenasMarkup: false,
          idOriginal: null
        }
      });
    }

    setLoading(false);
  }, [id]);

  // Handler para campos do formulário principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'frete' || name === 'ipi') {
      // Permite apenas números e vírgula
      const valorNumerico = value.replace(/[^\d,]/g, '');
      // Garante que só tenha uma vírgula
      const partes = valorNumerico.split(',');
      const valorFormatado = partes.length > 1 
        ? partes[0] + ',' + partes.slice(1).join('')
        : valorNumerico;
      
      setFormData(prev => ({
        ...prev,
        [name]: valorFormatado
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para contatos
  const handleContatoChange = (e) => {
    const { name, value } = e.target;
    setNovoContato(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddContato = () => {
    const { nome, setor, telefone, email } = novoContato;
    if (!nome || !setor || !telefone || !email) {
      alert('Por favor, preencha todos os campos do contato.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      contatos: [...prev.contatos, novoContato]
    }));

    setNovoContato({ nome: '', setor: '', telefone: '', email: '' });
  };

  const handleRemoveContato = (index) => {
    setFormData(prev => ({
      ...prev,
      contatos: prev.contatos.filter((_, i) => i !== index)
    }));
  };

  // Handler para campos do formulário de tributos
  const handleTributoChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'frete' || name === 'ipi') {
      // Permite apenas números e vírgula
      const valorNumerico = value.replace(/[^\d,]/g, '');
      // Garante que só tenha uma vírgula
      const partes = valorNumerico.split(',');
      const valorFormatado = partes.length > 1 
        ? partes[0] + ',' + partes.slice(1).join('')
        : valorNumerico;
      
      setFormData(prev => ({
        ...prev,
        tributoTemp: {
          ...prev.tributoTemp,
          [name]: valorFormatado
        }
      }));
      return;
    }

    // Handler especial para checkbox apenasMarkup
    if (name === 'apenasMarkup') {
      setFormData(prev => ({
        ...prev,
        tributoTemp: {
          ...prev.tributoTemp,
          apenasMarkup: checked,
          // Se marcado como apenas markup, limpar frete, IPI e descontos
          frete: checked ? '0' : prev.tributoTemp.frete,
          ipi: checked ? '0' : prev.tributoTemp.ipi,
          descontos: checked ? [] : prev.tributoTemp.descontos,
          descontoTemp: checked ? { valor: '', observacao: '' } : prev.tributoTemp.descontoTemp
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      tributoTemp: {
        ...prev.tributoTemp,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  // Função para adicionar um novo conjunto de tributos
  const adicionarTributo = () => {
    const { nome, frete, ipi, descontos, descontoTemp, apenasMarkup, idOriginal } = formData.tributoTemp;

    if (!nome) {
      alert('Preencha o nome do conjunto de tributos.');
      return;
    }

    // Se não for apenas markup, validar frete e IPI
    if (!apenasMarkup && (frete === '' || ipi === '')) {
      alert('Preencha os valores de frete e IPI.');
      return;
    }

    // Se houver um desconto temporário não adicionado, adiciona ele aos descontos
    let descontosParaSalvar = [...descontos];
    if (descontoTemp.valor) {
      try {
        const valores = descontoTemp.valor.split('+').map(v => {
          const valorNumerico = Number(v.trim().replace(',', '.'));
          if (isNaN(valorNumerico)) {
            throw new Error('Por favor, insira valores numéricos válidos para o desconto.');
          }
          if (valorNumerico <= 0 || valorNumerico > 100) {
            throw new Error('Os descontos devem ser maiores que 0% e no máximo 100%.');
          }
          return valorNumerico;
        });

        descontosParaSalvar.push({
          id: Date.now(),
          valor: descontoTemp.valor.trim(),
          observacao: descontoTemp.observacao.trim()
        });
      } catch (error) {
        alert(error.message);
        return;
      }
    }

    // Garantir que os descontos sejam salvos corretamente
    const descontosFormatados = descontosParaSalvar.map(desconto => ({
      id: desconto.id,
      valor: desconto.valor.toString(),
      observacao: desconto.observacao || ''
    }));

    // Usar ID original se estiver editando, senão criar novo ID
    const tributoId = idOriginal || Date.now();

    const novoTributo = {
      id: tributoId,
      nome: nome.trim(),
      frete: apenasMarkup ? '0' : frete.toString(),
      ipi: apenasMarkup ? '0' : ipi.toString(),
      descontos: apenasMarkup ? [] : descontosFormatados,
      apenasMarkup: apenasMarkup
    };

    console.log('Adicionando tributo:', novoTributo); // Debug
    console.log('ID usado:', tributoId, idOriginal ? '(original)' : '(novo)');

    setFormData(prev => ({
      ...prev,
      tributosDescontos: [...prev.tributosDescontos, novoTributo],
      tributoTemp: {
        nome: '',
        frete: '',
        ipi: '',
        descontos: [],
        descontoTemp: {
          valor: '',
          observacao: ''
        },
        apenasMarkup: false,
        idOriginal: null
      }
    }));

    // Fechar o formulário após adicionar
    setShowTributoForm(false);
  };

  // Função para remover um conjunto de tributos
  const removerTributo = (idTributo) => {
    setFormData(prev => ({
      ...prev,
      tributosDescontos: prev.tributosDescontos.filter(t => t.id !== idTributo)
    }));
  };

  // Função para editar um conjunto de tributos
  const editarTributo = (tributo) => {
    setFormData(prev => ({
      ...prev,
      tributoTemp: {
        nome: tributo.nome,
        frete: tributo.frete.toString(),
        ipi: tributo.ipi.toString(),
        descontos: [...tributo.descontos],
        descontoTemp: { valor: '', observacao: '' },
        apenasMarkup: tributo.apenasMarkup || false,
        idOriginal: tributo.id // Guardar o ID original para manter a referência
      }
    }));
    
    // Remove o tributo da lista para que seja substituído pelo editado
    setFormData(prev => ({
      ...prev,
      tributosDescontos: prev.tributosDescontos.filter(t => t.id !== tributo.id)
    }));

    // Abrir o formulário para edição
    setShowTributoForm(true);
  };

  // Handler para campos do formulário de desconto
  const handleDescontoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'valor') {
      // Permite apenas números, vírgula e +
      const valorNumerico = value.replace(/[^\d,+\s]/g, '');
      // Garante que só tenha uma vírgula entre os números
      const partes = valorNumerico.split('+').map(parte => {
        const numeros = parte.trim().split(',');
        return numeros.length > 1 
          ? numeros[0] + ',' + numeros.slice(1).join('')
          : parte.trim();
      });
      const valorFormatado = partes.join('+');
      
      setFormData(prev => ({
        ...prev,
        tributoTemp: {
          ...prev.tributoTemp,
          descontoTemp: {
            ...prev.tributoTemp.descontoTemp,
            [name]: valorFormatado
          }
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      tributoTemp: {
        ...prev.tributoTemp,
        descontoTemp: {
          ...prev.tributoTemp.descontoTemp,
          [name]: value
        }
      }
    }));
  };

  // Função para adicionar um novo desconto ao tributo atual
  const adicionarDesconto = () => {
    const { valor, observacao } = formData.tributoTemp.descontoTemp;

    if (!valor) {
      alert('Preencha o valor do desconto.');
      return;
    }

    try {
      const valores = valor.split('+').map(v => {
        const valorNumerico = Number(v.trim().replace(',', '.'));
        if (isNaN(valorNumerico)) {
          throw new Error('Por favor, insira valores numéricos válidos para o desconto.');
        }
        if (valorNumerico <= 0 || valorNumerico > 100) {
          throw new Error('Os descontos devem ser maiores que 0% e no máximo 100%.');
        }
        return valorNumerico;
      });

      const novoDesconto = {
        id: Date.now(),
        valor: valor.trim(),
        observacao: observacao.trim()
      };

      setFormData(prev => ({
        ...prev,
        tributoTemp: {
          ...prev.tributoTemp,
          descontos: [...prev.tributoTemp.descontos, novoDesconto],
          descontoTemp: { valor: '', observacao: '' }
        }
      }));
    } catch (error) {
      alert(error.message);
    }
  };

  // Função para remover um desconto do tributo atual
  const removerDesconto = (idDesconto) => {
    setFormData(prev => ({
      ...prev,
      tributoTemp: {
        ...prev.tributoTemp,
        descontos: prev.tributoTemp.descontos.filter(d => d.id !== idDesconto)
      }
    }));
  };

  // Funções auxiliares para cálculos (copiadas do NovoProduto.jsx)
  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return '';
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const converterParaNumero = (valor) => {
    try {
      if (!valor || valor === '') return 0;
      
      // Se já for número, retornar
      if (typeof valor === 'number') return valor;
      
      // Converter string para número
      const valorLimpo = valor.toString()
        .replace(/[R$\s]/g, '') // Remove R$, espaços
        .replace(/\./g, '') // Remove pontos (separadores de milhares)
        .replace(',', '.'); // Substitui vírgula por ponto
      
      const numero = parseFloat(valorLimpo);
      
      // Verificar se é um número válido
      if (isNaN(numero)) {
        console.warn('⚠️ Valor inválido para conversão:', valor);
        return 0;
      }
      
      return numero;
    } catch (error) {
      console.error('❌ Erro ao converter valor para número:', valor, error);
      return 0;
    }
  };

  const calcularCustoLiquido = (custoBruto, descontos, frete, ipi) => {
    try {
      console.log('🔢 Calculando custo líquido com:', { custoBruto, descontos, frete, ipi });
      
      let custo = converterParaNumero(custoBruto) || 0;
      console.log('   Custo bruto convertido:', custo);
      
      // 1. Aplicar descontos primeiro (reduz o custo)
      if (descontos && descontos.trim()) {
        const descontosArray = descontos.split('+').map(d => converterParaNumero(d.trim())).filter(d => !isNaN(d));
        console.log('   Descontos aplicados:', descontosArray);
        descontosArray.forEach(desconto => {
          custo = custo * (1 - desconto / 100);
        });
      }

      // 2. Aplicar frete (adiciona ao custo)
      if (frete) {
        const valorFrete = converterParaNumero(frete) || 0;
        console.log('   Frete aplicado:', valorFrete);
        custo += custo * (valorFrete / 100);
      }

      // 3. Aplicar IPI (adiciona ao custo + frete)
      if (ipi) {
        const valorIpi = converterParaNumero(ipi) || 0;
        console.log('   IPI aplicado:', valorIpi);
        custo += custo * (valorIpi / 100);
      }

      console.log('   Custo líquido final:', custo);
      return custo; // Retorna o valor numérico, não formatado
    } catch (error) {
      console.error('❌ Erro ao calcular custo líquido:', error);
      return 0;
    }
  };

  const calcularTABC = (custoLiquido, markupSelecionado, markups) => {
    try {
      console.log('💰 Calculando TABC com:', { custoLiquido, markupSelecionado, markups });
      
      if (!markupSelecionado || !custoLiquido || custoLiquido <= 0) {
        console.log('   Valores inválidos, retornando 0');
        return 0;
      }
      
      const markup = markups.find(m => m.id === parseInt(markupSelecionado));
      if (!markup) {
        console.log('   Markup não encontrado, retornando 0');
        return 0;
      }
      
      console.log('   Markup encontrado:', markup);
      const valorMarkup = parseFloat(markup.valor.replace('%', '')) || 0;
      console.log('   Valor do markup:', valorMarkup);
      
      const valorAdicional = custoLiquido * (valorMarkup / 100);
      const tabc = custoLiquido + valorAdicional;
      
      console.log('   TABC calculado:', tabc);
      return tabc;
    } catch (error) {
      console.error('❌ Erro ao calcular TABC:', error);
      return 0;
    }
  };

  // Handler para salvar fornecedor
  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      console.log('🚀 Iniciando salvamento do fornecedor...');
      
      let produtosAtualizados = false;
      let produtosAtualizadosCount = 0;
      
      const { tributoTemp, ...dadosFornecedor } = formData;
      
      // Logs detalhados para debug
      console.log('=== DEBUG DO SALVAMENTO ===');
      console.log('1. Estado atual do formulário:', formData);
      console.log('2. Contatos antes de salvar:', formData.contatos);
      console.log('3. Tributos antes de salvar:', formData.tributosDescontos);
      console.log('4. Dados do fornecedor (sem tributoTemp):', dadosFornecedor);

      // Garantir que os tributos e descontos sejam salvos corretamente
      console.log('📝 Preparando fornecedor para salvar...');
      const fornecedorParaSalvar = {
        ...dadosFornecedor,
        tributosDescontos: formData.tributosDescontos.map(tributo => ({
          ...tributo,
          frete: tributo.frete.toString(),
          ipi: tributo.ipi.toString(),
          descontos: tributo.descontos.map(desconto => ({
            id: desconto.id,
            valor: desconto.valor.toString(),
            observacao: desconto.observacao
          }))
        }))
      };
      console.log('✅ Fornecedor preparado:', fornecedorParaSalvar);

      // Carregar fornecedores existentes
      console.log('📂 Carregando fornecedores existentes...');
      const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
      console.log('5. Fornecedores existentes:', fornecedores);
      
      // Se estiver editando, guardar o nome antigo do fornecedor para sincronização
      let nomeFornecedorAntigo = null;
      if (id) {
        const fornecedorAntigo = fornecedores.find(f => f.id === parseInt(id));
        if (fornecedorAntigo) {
          nomeFornecedorAntigo = fornecedorAntigo.nomeFantasia;
        }
      }
      
      console.log('💾 Salvando fornecedor...');
      if (id) {
        // Atualizar fornecedor existente
        const index = fornecedores.findIndex(f => f.id === parseInt(id));
        if (index !== -1) {
          fornecedores[index] = {
            ...fornecedorParaSalvar,
            id: parseInt(id)
          };
          console.log('6. Atualizando fornecedor existente:', fornecedores[index]);
        }
      } else {
        // Criar novo fornecedor
        const novoId = Math.max(0, ...fornecedores.map(f => f.id)) + 1;
        const novoFornecedor = {
          ...fornecedorParaSalvar,
          id: novoId
        };
        fornecedores.push(novoFornecedor);
        console.log('6. Adicionando novo fornecedor:', novoFornecedor);
      }

      // Salvar no localStorage
      console.log('💾 Salvando no localStorage...');
      localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
      console.log('7. Fornecedores após salvar:', fornecedores);

      // SINCRONIZAR PRODUTOS - Atualizar produtos que usam este fornecedor
      console.log('🔄 Iniciando sincronização de produtos...');
      console.log('Fornecedor sendo salvo:', fornecedorParaSalvar.nomeFantasia);
      console.log('Tributos do fornecedor:', fornecedorParaSalvar.tributosDescontos);
      
      try {
        const produtos = JSON.parse(localStorage.getItem('produtos_cadastrados') || '[]');
        let produtosAtualizados = false;
        let produtosAtualizadosCount = 0;
        
        const produtosSincronizados = produtos.map(produto => {
          // Verificar se o produto usa este fornecedor
          const usaEsteFornecedor = produto.fornecedor === fornecedorParaSalvar.nomeFantasia;
          
          console.log(`🔍 Verificando produto: ${produto.descricao}`);
          console.log(`   Fornecedor do produto: ${produto.fornecedor}`);
          console.log(`   Usa este fornecedor? ${usaEsteFornecedor}`);
          console.log(`   Tributo selecionado: ${produto.tributoSelecionado}`);
          
          if (usaEsteFornecedor && produto.tributoSelecionado && produto.tributoSelecionado !== 'nenhum') {
            // Encontrar o tributo correspondente no fornecedor atualizado
            const tributoAtualizado = fornecedorParaSalvar.tributosDescontos.find(
              t => String(t.id) === String(produto.tributoSelecionado)
            );
            
            console.log(`   Tributo encontrado? ${!!tributoAtualizado}`);
            if (tributoAtualizado) {
              console.log(`   Nome do tributo: ${tributoAtualizado.nome}`);
            }
            
            if (tributoAtualizado) {
              console.log(`📦 Atualizando produto ${produto.descricao} (ID: ${produto.id})`);
              console.log(`   Tributo: ${tributoAtualizado.nome} (ID: ${tributoAtualizado.id})`);
              console.log(`   Frete: ${produto.frete} → ${tributoAtualizado.frete}`);
              console.log(`   IPI: ${produto.ipi} → ${tributoAtualizado.ipi}`);
              
              const novosDescontos = tributoAtualizado.descontos.map(d => d.valor).join('+');
              console.log(`   Descontos: ${produto.descontos} → ${novosDescontos}`);
              
              try {
                // RECALCULAR CUSTO LÍQUIDO E TABC
                console.log(`   Calculando custo líquido...`);
                const novoCustoLiquido = calcularCustoLiquido(
                  produto.custoBruto,
                  novosDescontos,
                  tributoAtualizado.frete,
                  tributoAtualizado.ipi
                );
                console.log(`   Custo líquido calculado: ${novoCustoLiquido}`);
                
                // Carregar markups para calcular TABC
                console.log(`   Carregando markups...`);
                const markups = JSON.parse(localStorage.getItem('markups_cadastrados') || '[]');
                console.log(`   Markups carregados:`, markups);
                
                console.log(`   Calculando TABC...`);
                const novoTABC = calcularTABC(
                  novoCustoLiquido,
                  produto.markupSelecionado,
                  markups
                );
                console.log(`   TABC calculado: ${novoTABC}`);
                
                console.log(`   Custo Líquido: ${produto.custoLiquido} → ${novoCustoLiquido.toFixed(2)}`);
                console.log(`   TABC: ${produto.tabc} → ${novoTABC.toFixed(2)}`);
                
                produtosAtualizados = true;
                produtosAtualizadosCount++;
                
                return {
                  ...produto,
                  frete: tributoAtualizado.frete,
                  ipi: tributoAtualizado.ipi,
                  descontos: novosDescontos,
                  custoLiquido: novoCustoLiquido,
                  tabc: novoTABC
                };
              } catch (calculoError) {
                console.error('❌ Erro ao calcular valores do produto:', calculoError);
                console.error('Dados do produto:', produto);
                console.error('Dados do tributo:', tributoAtualizado);
                // Retornar produto sem atualizar em caso de erro no cálculo
                return produto;
              }
            } else {
              console.log(`⚠️ Tributo não encontrado para o produto ${produto.descricao}`);
              console.log(`   ID do tributo no produto: ${produto.tributoSelecionado}`);
              console.log(`   IDs disponíveis no fornecedor:`, fornecedorParaSalvar.tributosDescontos.map(t => t.id));
            }
          }
          
          return produto;
        });
        
        if (produtosAtualizados) {
          console.log('💾 Salvando produtos atualizados...');
          localStorage.setItem('produtos_cadastrados', JSON.stringify(produtosSincronizados));
          console.log(`✅ ${produtosAtualizadosCount} produtos sincronizados com sucesso!`);
        } else {
          console.log('ℹ️ Nenhum produto precisou ser atualizado');
        }
      } catch (sincronizacaoError) {
        console.error('❌ Erro na sincronização de produtos:', sincronizacaoError);
        // Continuar mesmo se a sincronização falhar
      }

      // Verificar se os dados foram salvos corretamente
      console.log('🔍 Verificando dados salvos...');
      const dadosSalvos = JSON.parse(localStorage.getItem('fornecedores'));
      const fornecedorSalvo = id 
        ? dadosSalvos.find(f => f.id === parseInt(id))
        : dadosSalvos.find(f => f.id === Math.max(...dadosSalvos.map(f => f.id)));

      console.log('8. Fornecedor salvo (verificação):', fornecedorSalvo);
      console.log('9. Contatos do fornecedor salvo:', fornecedorSalvo?.contatos);
      console.log('10. Tributos do fornecedor salvo:', fornecedorSalvo?.tributosDescontos);
      console.log('=== FIM DO DEBUG ===');

      // Mostrar mensagem de sucesso
      if (produtosAtualizados) {
        alert(`Fornecedor salvo com sucesso!\n\n${produtosAtualizadosCount} produto(s) que usam este fornecedor foram atualizados automaticamente.\n\n✅ Tributos atualizados\n✅ Custo líquido recalculado\n✅ TABC recalculado`);
      } else {
        alert('Fornecedor salvo com sucesso!');
      }

      console.log('🎉 Salvamento concluído com sucesso!');
      navigate('/fornecedores');
    } catch (error) {
      console.error('❌ Erro ao salvar fornecedor:', error);
      console.error('Stack trace:', error.stack);
      alert('Erro ao salvar fornecedor. Por favor, tente novamente.\n\nDetalhes: ' + error.message);
    }
  };

  // Handler para excluir fornecedor
  const handleDelete = () => {
    if (!window.confirm('Deseja realmente excluir este fornecedor?')) return;

    try {
      const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
      const novosFornecedores = fornecedores.filter(f => f.id !== parseInt(id));
      localStorage.setItem('fornecedores', JSON.stringify(novosFornecedores));
      alert('Fornecedor excluído com sucesso.');
      navigate('/fornecedores');
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      alert('Erro ao excluir fornecedor.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/fornecedores/tabelas')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaTable /> Tabelas
          </button>
          <button
            onClick={() => navigate('/fornecedores/catalogos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaBook /> Catálogos
          </button>
          <button
            onClick={() => navigate('/fornecedores/avisos')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaBell /> Avisos
          </button>
          <button
            onClick={() => navigate('/fornecedores')}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Voltar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Informações de Contato */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaBook className="text-blue-600" /> Informações de Contato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input
                type="text"
                name="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Razão Social</label>
              <input
                type="text"
                name="razaoSocial"
                value={formData.razaoSocial}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Representante</label>
              <input
                type="text"
                name="representante"
                value={formData.representante}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Encomendas)</label>
              <input
                type="email"
                name="emailEncomendas"
                value={formData.emailEncomendas}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Assistência)</label>
              <input
                type="email"
                name="emailAssistencia"
                value={formData.emailAssistencia}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Contatos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaPhone className="text-blue-600" /> Contatos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome"
              name="nome"
              value={novoContato.nome}
              onChange={handleContatoChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Setor"
              name="setor"
              value={novoContato.setor}
              onChange={handleContatoChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Telefone"
              name="telefone"
              value={novoContato.telefone}
              onChange={handleContatoChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={novoContato.email}
                onChange={handleContatoChange}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddContato}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {formData.contatos.length > 0 && (
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.contatos.map((contato, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contato.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contato.setor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contato.telefone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contato.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          type="button"
                          onClick={() => handleRemoveContato(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção 3: Tributos e Descontos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-blue-600" /> Tributos e Descontos
          </h2>
          
          {/* Botão para abrir formulário de novo conjunto de tributos */}
          {!showTributoForm && (
            <div className="mb-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowTributoForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaPlus /> Novo Conjunto de Tributos
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="apenasMarkup"
                  checked={formData.tributoTemp.apenasMarkup}
                  onChange={handleTributoChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Apenas Markup
              </label>
            </div>
          )}

          {/* Formulário de novo conjunto de tributos */}
          {showTributoForm && (
            <div className="bg-gray-200 border-2 border-gray-300 p-6 rounded-lg mb-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900">Novo Conjunto de Tributos</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowTributoForm(false);
                    // Limpar o formulário ao fechar
                    setFormData(prev => ({
                      ...prev,
                      tributoTemp: {
                        nome: '',
                        frete: '',
                        ipi: '',
                        descontos: [],
                        descontoTemp: { valor: '', observacao: '' },
                        apenasMarkup: false,
                        idOriginal: null
                      }
                    }));
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Conjunto</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.tributoTemp.nome}
                    onChange={handleTributoChange}
                    placeholder="Ex: Tributos para Produtos Nacionais"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="apenasMarkup"
                      checked={formData.tributoTemp.apenasMarkup}
                      onChange={handleTributoChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Apenas Markup
                  </label>
                </div>
              </div>

              {/* Campos de Frete e IPI - só aparecem se não for apenas markup */}
              {!formData.tributoTemp.apenasMarkup && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frete (%)</label>
                    <input
                      type="text"
                      name="frete"
                      value={formData.tributoTemp.frete}
                      onChange={handleTributoChange}
                      placeholder="Ex: 5,5"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">IPI (%)</label>
                    <input
                      type="text"
                      name="ipi"
                      value={formData.tributoTemp.ipi}
                      onChange={handleTributoChange}
                      placeholder="Ex: 7,5"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Formulário de descontos - só aparece se não for apenas markup */}
              {!formData.tributoTemp.apenasMarkup && (
                <div className="border-t border-gray-300 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Descontos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                      <label className="block text-sm font-medium text-gray-700">Descontos (%)</label>
                      <input
                        type="text"
                        name="valor"
                        value={formData.tributoTemp.descontoTemp.valor}
                        onChange={handleDescontoChange}
                        placeholder="Ex: 8,3+7+6+2,1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separe os valores com "+" (ex: 8,3+7+6+2,1)</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                      <label className="block text-sm font-medium text-gray-700">Observação</label>
                      <input
                        type="text"
                        name="observacao"
                        value={formData.tributoTemp.descontoTemp.observacao}
                        onChange={handleDescontoChange}
                        placeholder="Observações adicionais"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de descontos do tributo atual */}
              {formData.tributoTemp.descontos.length > 0 && (
                <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valores</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.tributoTemp.descontos.map(desconto => (
                        <tr key={desconto.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {desconto.valor.split('+').map((valor, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                                {valor.trim().replace('.', ',')}%
                              </span>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{desconto.observacao}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => removerDesconto(desconto.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={adicionarTributo}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Adicionar Conjunto de Tributos
                </button>
              </div>
            </div>
          )}

          {/* Lista de conjuntos de tributos */}
          {formData.tributosDescontos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Conjuntos de Tributos Cadastrados</h3>
              <div className="space-y-4">
                {formData.tributosDescontos.map(tributo => (
                  <div key={tributo.id} className="bg-gray-200 border-2 border-gray-300 p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-gray-900">{tributo.nome}</h4>
                        {tributo.apenasMarkup && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Apenas Markup
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarTributo(tributo)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar tributo"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => removerTributo(tributo.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir tributo"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    {!tributo.apenasMarkup && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Frete: </span>
                          <span className="text-sm text-gray-900">
                            {tributo.frete.toString().replace('.', ',')}%
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">IPI: </span>
                          <span className="text-sm text-gray-900">
                            {tributo.ipi.toString().replace('.', ',')}%
                          </span>
                        </div>
                      </div>
                    )}

                    {tributo.descontos && tributo.descontos.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Descontos:</h5>
                        <div className="space-y-2">
                          {tributo.descontos.map(desconto => (
                            <div key={desconto.id} className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm">
                              <div className="flex flex-wrap gap-1 mb-1">
                                {desconto.valor.split('+').map((valor, index) => (
                                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {valor.trim().replace('.', ',')}%
                                  </span>
                                ))}
                              </div>
                              {desconto.observacao && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  Obs: {desconto.observacao}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seção 4: Observações */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaPencilAlt className="text-blue-600" /> Observações
          </h2>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Digite aqui observações gerais sobre o fornecedor..."
          ></textarea>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FaTrash /> Excluir
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaSave /> {id ? 'Salvar Alterações' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoFornecedor; 
