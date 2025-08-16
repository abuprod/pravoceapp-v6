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
        }
      }
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Obter clientes existentes
    const clientesSalvos = localStorage.getItem('clientes');
    let clientes = clientesSalvos ? JSON.parse(clientesSalvos) : [];
    
    const clienteAtualizado = {
      ...formData,
      id: id ? parseInt(id) : Date.now() // Mantém o ID se estiver editando, ou cria um novo
    };

    if (id) {
      // Atualizar cliente existente
      clientes = clientes.map(c => 
        c.id === parseInt(id) ? clienteAtualizado : c
      );
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
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.tipoPessoa === 'pf' ? 'Nome Completo' : 'Razão Social'}
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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