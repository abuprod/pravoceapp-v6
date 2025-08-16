import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

const NovoProduto = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sku: '',
    descricao: '',
    custoBruto: '',
    descontos: '',
    frete: '',
    ipi: '',
    tabc: '',
    estoqueInicial: '',
    localizacoes: [{ localizacao: '', quantidade: '' }],
    observacoes: '',
    categoria: '',
    dataLancamento: new Date().toISOString().split('T')[0],
    status: 'ativo',
    historico: []
  });

  const [erros, setErros] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddLocalizacao = () => {
    setFormData(prev => ({
      ...prev,
      localizacoes: [...prev.localizacoes, { localizacao: '', quantidade: '' }]
    }));
  };

  const handleRemoveLocalizacao = (index) => {
    setFormData(prev => ({
      ...prev,
      localizacoes: prev.localizacoes.filter((_, i) => i !== index)
    }));
  };

  const handleLocalizacaoChange = (index, field, value) => {
    const newLocalizacoes = [...formData.localizacoes];
    newLocalizacoes[index][field] = value;
    setFormData(prev => ({
      ...prev,
      localizacoes: newLocalizacoes
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de validação e envio
    console.log('Dados do formulário:', formData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/produtos')}
          className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
        >
          <FaArrowLeft className="mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Novo Produto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.sku ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.sku && <p className="text-red-500 text-xs mt-1">{erros.sku}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.descricao ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.descricao && <p className="text-red-500 text-xs mt-1">{erros.descricao}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.categoria ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">Selecione...</option>
              <option value="sofa">Sofá</option>
              <option value="mesa">Mesa</option>
              <option value="cadeira">Cadeira</option>
              <option value="poltrona">Poltrona</option>
              <option value="decoracao">Decoração</option>
              <option value="outros">Outros</option>
            </select>
            {erros.categoria && <p className="text-red-500 text-xs mt-1">{erros.categoria}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Lançamento</label>
            <input
              type="date"
              name="dataLancamento"
              value={formData.dataLancamento}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.dataLancamento ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.dataLancamento && <p className="text-red-500 text-xs mt-1">{erros.dataLancamento}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custo Bruto</label>
            <input
              type="number"
              name="custoBruto"
              value={formData.custoBruto}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.custoBruto ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.custoBruto && <p className="text-red-500 text-xs mt-1">{erros.custoBruto}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descontos (%)</label>
            <input
              type="text"
              name="descontos"
              value={formData.descontos}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.descontos ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: 5+2+1"
            />
            {erros.descontos && <p className="text-red-500 text-xs mt-1">{erros.descontos}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frete (%)</label>
            <input
              type="number"
              name="frete"
              value={formData.frete}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.frete ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erros.frete && <p className="text-red-500 text-xs mt-1">{erros.frete}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPI (%)</label>
            <input
              type="number"
              name="ipi"
              value={formData.ipi}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.ipi ? 'border-red-500' : 'border-gray-300'}`}
            />
            {erros.ipi && <p className="text-red-500 text-xs mt-1">{erros.ipi}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TABC</label>
            <input
              type="number"
              name="tabc"
              value={formData.tabc}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.tabc ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.tabc && <p className="text-red-500 text-xs mt-1">{erros.tabc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial</label>
            <input
              type="number"
              name="estoqueInicial"
              value={formData.estoqueInicial}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${erros.estoqueInicial ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {erros.estoqueInicial && <p className="text-red-500 text-xs mt-1">{erros.estoqueInicial}</p>}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Localizações</h2>
          {formData.localizacoes.map((localizacao, index) => (
            <div key={index} className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={localizacao.localizacao}
                  onChange={(e) => handleLocalizacaoChange(index, 'localizacao', e.target.value)}
                  placeholder="Localização"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={localizacao.quantidade}
                  onChange={(e) => handleLocalizacaoChange(index, 'quantidade', e.target.value)}
                  placeholder="Quantidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveLocalizacao(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddLocalizacao}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <FaPlus className="mr-2" />
            Adicionar Localização
          </button>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="3"
          />
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Lançamentos</h2>
          {formData.historico.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.historico.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.data}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum lançamento registrado</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoProduto; 