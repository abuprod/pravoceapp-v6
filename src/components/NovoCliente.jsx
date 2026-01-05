import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const NovoCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const origemPedido = searchParams.get('origem') === 'pedido';

  // Função auxiliar para navegar de volta ao pedido
  const navegarDeVoltaAoPedido = () => {
    const dadosRetorno = localStorage.getItem('pedidoTempParaRetorno');
    
    let urlRetorno = '/pedidos-venda/novo'; // fallback
    
    if (dadosRetorno) {
      try {
        const dados = JSON.parse(dadosRetorno);
        urlRetorno = dados.urlRetorno || '/pedidos-venda/novo';
      } catch (error) {
        console.error('❌ Erro ao recuperar URL de retorno:', error);
      }
    } else {
      console.log('⚠️ Não há dados de retorno salvos');
    }
    
    navigate(urlRetorno);
  };
  const [formData, setFormData] = useState({
    tipoPessoa: 'pf',
    nome: '',
    cpfCnpj: '',
    telefone1: '',
    telefone2: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });

  // Estados para busca e sugestões de clientes
  const [clientesCadastrados, setClientesCadastrados] = useState([]);
  const [mostrarSugestoesCliente, setMostrarSugestoesCliente] = useState(false);
  const [buscaNomeCliente, setBuscaNomeCliente] = useState('');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState(null);

  // Carregar clientes cadastrados
  useEffect(() => {
    const clientesSalvos = localStorage.getItem('clientes');
    if (clientesSalvos) {
      const clientes = JSON.parse(clientesSalvos);
      setClientesCadastrados(clientes);
    }
  }, []);

  // Carregar dados do cliente se estiver editando
  useEffect(() => {
    if (id) {
      const clientesSalvos = localStorage.getItem('clientes');
      if (clientesSalvos) {
        const clientes = JSON.parse(clientesSalvos);
        const clienteParaEditar = clientes.find(c => c.id === parseInt(id));
        if (clienteParaEditar) {
          setFormData({
            tipoPessoa: clienteParaEditar.tipoPessoa,
            nome: clienteParaEditar.nome,
            cpfCnpj: clienteParaEditar.cpfCnpj,
            telefone1: clienteParaEditar.telefone1,
            telefone2: clienteParaEditar.telefone2 || '',
            email: clienteParaEditar.email || '',
            cep: clienteParaEditar.cep || '',
            logradouro: clienteParaEditar.logradouro || '',
            numero: clienteParaEditar.numero || '',
            complemento: clienteParaEditar.complemento || '',
            bairro: clienteParaEditar.bairro || '',
            cidade: clienteParaEditar.cidade || '',
            estado: clienteParaEditar.estado || '',
            observacoes: clienteParaEditar.observacoes || ''
          });
          setClienteSelecionadoId(parseInt(id));
        }
      }
    }
  }, [id]);

  // Filtrar clientes para sugestões
  const clientesFiltrados = clientesCadastrados.filter(cliente => {
    // Excluir o cliente atual se estiver editando
    if (id && cliente.id === parseInt(id)) {
      return false;
    }
    
    const match = cliente.nome?.toLowerCase().includes(buscaNomeCliente.toLowerCase()) ||
      cliente.cpfCnpj?.includes(buscaNomeCliente) ||
      cliente.telefone1?.includes(buscaNomeCliente) ||
      cliente.telefone2?.includes(buscaNomeCliente);
    
    return match && buscaNomeCliente.trim().length > 0;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Se o campo alterado for "nome", também atualizar a busca
    if (name === 'nome') {
      setBuscaNomeCliente(value);
      setMostrarSugestoesCliente(value.trim().length > 0);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para selecionar cliente das sugestões
  const selecionarCliente = (cliente) => {
    setFormData({
      tipoPessoa: cliente.tipoPessoa || 'pf',
      nome: cliente.nome || '',
      cpfCnpj: cliente.cpfCnpj || '',
      telefone1: cliente.telefone1 || '',
      telefone2: cliente.telefone2 || '',
      email: cliente.email || '',
      cep: cliente.cep || '',
      logradouro: cliente.logradouro || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      observacoes: cliente.observacoes || ''
    });
    // Se selecionou um cliente existente, usar o ID dele
    setClienteSelecionadoId(cliente.id);
    setBuscaNomeCliente('');
    setMostrarSugestoesCliente(false);
  };

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sugestoes-cliente-container')) {
        setMostrarSugestoesCliente(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Obter clientes existentes
    const clientesSalvos = localStorage.getItem('clientes');
    let clientes = clientesSalvos ? JSON.parse(clientesSalvos) : [];
    
    // Se selecionou um cliente nas sugestões, usar o ID dele (mesmo se estiver editando)
    // Se estiver editando (tem id no URL) e não selecionou outro cliente, usar o ID do URL
    // Senão, criar novo ID
    const idParaUsar = clienteSelecionadoId || (id ? parseInt(id) : Date.now());
    
    const clienteAtualizado = {
      ...formData,
      id: idParaUsar
    };

    // Se está editando ou selecionou um cliente existente, atualizar
    if (id || clienteSelecionadoId) {
      // Verificar se o cliente já existe (pode não existir se for novo ID)
      const clienteExiste = clientes.some(c => c.id === idParaUsar);
      
      if (clienteExiste) {
        // Atualizar cliente existente
        clientes = clientes.map(c => 
          c.id === idParaUsar ? clienteAtualizado : c
        );
      } else {
        // Adicionar novo cliente (não deveria acontecer, mas por segurança)
        clientes.push(clienteAtualizado);
      }
    } else {
      // Adicionar novo cliente
      clientes.push(clienteAtualizado);
    }

    // Salvar no localStorage
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Se veio do pedido de venda, salvar cliente e voltar
    if (origemPedido) {
      if (!id) {
        // Cliente novo - salvar como recém-criado
        localStorage.setItem('clienteRecemCriado', JSON.stringify(clienteAtualizado));
      } else {
        // Cliente editado - atualizar o cliente selecionado
        localStorage.setItem('clienteEditado', JSON.stringify(clienteAtualizado));
      }
      navegarDeVoltaAoPedido();
      return;
    }
    
    // Senão, navegar de volta para a lista
    navigate('/cadastro-cliente');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Novo Cliente</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              if (origemPedido) {
                navegarDeVoltaAoPedido();
              } else {
                navigate('/cadastro-cliente');
              }
            }}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Voltar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Pessoa */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pessoa
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tipoPessoa"
                  value="pf"
                  checked={formData.tipoPessoa === 'pf'}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Pessoa Física</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tipoPessoa"
                  value="pj"
                  checked={formData.tipoPessoa === 'pj'}
                  onChange={handleChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Pessoa Jurídica</span>
              </label>
            </div>
          </div>

          {/* Nome/Razão Social */}
          <div className="col-span-2 sugestoes-cliente-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.tipoPessoa === 'pf' ? 'Nome Completo' : 'Razão Social'}
            </label>
            <div className="relative">
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                onFocus={() => {
                  if (formData.nome.trim().length > 0) {
                    setMostrarSugestoesCliente(true);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              {/* Sugestões de clientes */}
              {mostrarSugestoesCliente && buscaNomeCliente && clientesFiltrados.length > 0 && (
                <div 
                  className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-500 rounded-md shadow-2xl max-h-40 overflow-y-auto"
                  style={{backgroundColor: 'white', border: '2px solid #3b82f6'}}
                >
                  {clientesFiltrados.map((cliente, idx) => (
                    <div
                      key={cliente.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selecionarCliente(cliente);
                      }}
                    >
                      <div className="font-medium">{cliente.nome}</div>
                      <div className="text-gray-600">
                        {cliente.tipoPessoa === 'pf' ? 'CPF: ' : 'CNPJ: '}{cliente.cpfCnpj}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Tel: {cliente.telefone1}
                        {cliente.telefone2 && ` / ${cliente.telefone2}`}
                        {cliente.email && ` | Email: ${cliente.email}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}
            </label>
            <input
              type="text"
              name="cpfCnpj"
              value={formData.cpfCnpj}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Telefones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone 1
            </label>
            <input
              type="tel"
              name="telefone1"
              value={formData.telefone1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone 2
            </label>
            <input
              type="tel"
              name="telefone2"
              value={formData.telefone2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP
            </label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logradouro
            </label>
            <input
              type="text"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número
            </label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complemento
            </label>
            <input
              type="text"
              name="complemento"
              value={formData.complemento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro
            </label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>

          {/* Observações */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (origemPedido) {
                navegarDeVoltaAoPedido();
              } else {
                navigate('/cadastro-cliente');
              }
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaSave /> Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoCliente; 