import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaTimes, FaUser, FaCalendarAlt, FaClock, FaShoppingCart } from 'react-icons/fa';

const NovoControleFluxo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    id: null,
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    nome: '',
    telefone: '',
    vendedor: '',
    oQueProcurava: '',
    produtos: [{
      produto: '',
      quantidade: ''
    }],
    motivoNaoCompra: '',
    observacoes: '',
    dataCriacao: new Date().toISOString().split('T')[0]
  });

  // Carregar dados existentes se for edição
  useEffect(() => {
    if (id) {
      const registros = JSON.parse(localStorage.getItem('controleFluxo') || '[]');
      const registroExistente = registros.find(r => r.id === parseInt(id));
      if (registroExistente) {
        setFormData(registroExistente);
      } else {
        navigate('/controle-fluxo');
      }
    }
  }, [id, navigate]);

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
    setFormData(prev => ({ ...prev, produtos: newProdutos }));
  };

  const addProduto = () => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, {
        produto: '',
        quantidade: ''
      }]
    }));
  };

  const removeProduto = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!formData.nome || !formData.vendedor) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Carregar registros existentes
    const registros = JSON.parse(localStorage.getItem('controleFluxo') || '[]');

    if (id) {
      // Atualizar registro existente
      const index = registros.findIndex(r => r.id === parseInt(id));
      if (index !== -1) {
        registros[index] = {
          ...registros[index],
          ...formData,
          dataAtualizacao: new Date().toISOString()
        };
      }
    } else {
      // Adicionar novo registro
      registros.push({
        ...formData,
        id: Date.now(),
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      });
    }

    // Salvar no localStorage
    localStorage.setItem('controleFluxo', JSON.stringify(registros));

    // Redirecionar para a lista
    navigate('/controle-fluxo');
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Novo Registro de Fluxo</h1>
        <Link
          to="/controle-fluxo"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 w-full">
        {/* Box de Dados Básicos */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Dados do Registro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor *</label>
              <select
                name="vendedor"
                value={formData.vendedor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione...</option>
                <option value="elaine">Elaine</option>
                <option value="bruno">Bruno</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Produtos específicos */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaShoppingCart className="mr-2 text-green-600" />
              Produtos Específicos
            </h2>
            <button
              type="button"
              onClick={addProduto}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <FaPlus className="mr-1" />
              Adicionar Produto
            </button>
          </div>

          {formData.produtos.map((produto, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Produto {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeProduto(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                  <input
                    type="text"
                    value={produto.produto}
                    onChange={(e) => handleProdutoChange(index, 'produto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="text"
                    value={produto.quantidade}
                    onChange={(e) => handleProdutoChange(index, 'quantidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Quantidade desejada"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Box de Motivo da Não Compra */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaTimes className="mr-2 text-red-600" />
            Motivo da Não Compra
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Não Compra</label>
            <textarea
              name="motivoNaoCompra"
              value={formData.motivoNaoCompra}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descreva com suas próprias palavras o motivo pelo qual o cliente não comprou..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações Adicionais</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Observações adicionais sobre o atendimento..."
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/controle-fluxo')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovoControleFluxo; 