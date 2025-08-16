import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch } from 'react-icons/fa';

const MARKUP_STORAGE_KEY = 'markups_cadastrados';

const PainelMarkup = () => {
  const [markups, setMarkups] = useState(() => {
    const markupsSalvos = localStorage.getItem(MARKUP_STORAGE_KEY);
    return markupsSalvos ? JSON.parse(markupsSalvos) : [
      {
        id: 1,
        titulo: 'Markup Padrão',
        valor: '100%',
        aplicaTodosFornecedores: true,
        itensEspecificos: []
      }
    ];
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExclusao, setModalExclusao] = useState({
    isOpen: false,
    markupId: null,
    markupTitulo: ''
  });

  const [formData, setFormData] = useState({
    id: null,
    titulo: '',
    valor: '',
    aplicaTodosFornecedores: false,
    aplicaEspecificos: false,
    itensEspecificos: []
  });

  const [buscaItem, setBuscaItem] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Simulação de dados para autocompletar
  const dadosAutocompletar = [
    { id: 1, tipo: 'sku', valor: 'SOF001', descricao: 'Sofá 3 Lugares' },
    { id: 2, tipo: 'sku', valor: 'MES001', descricao: 'Mesa de Jantar' },
    { id: 3, tipo: 'fornecedor', valor: 'Móveis ABC', descricao: 'Móveis ABC' },
    { id: 4, tipo: 'fornecedor', valor: 'Móveis XYZ', descricao: 'Móveis XYZ' }
  ];

  // Função para buscar sugestões
  const buscarSugestoes = (termo) => {
    if (!termo.trim()) {
      setSugestoes([]);
      return;
    }

    const termoBusca = termo.toLowerCase();
    const sugestoesEncontradas = dadosAutocompletar.filter(item =>
      item.valor.toLowerCase().includes(termoBusca) ||
      item.descricao.toLowerCase().includes(termoBusca)
    );

    // Filtrar itens que já foram selecionados
    const sugestoesFiltradas = sugestoesEncontradas.filter(
      sugestao => !formData.itensEspecificos.some(
        item => item.id === sugestao.id
      )
    );

    setSugestoes(sugestoesFiltradas);
  };

  // Atualizar sugestões quando o termo de busca mudar
  useEffect(() => {
    buscarSugestoes(buscaItem);
  }, [buscaItem]);

  const handleSelecionarItem = (item) => {
    setFormData(prev => ({
      ...prev,
      itensEspecificos: [...prev.itensEspecificos, item]
    }));
    setBuscaItem('');
    setSugestoes([]);
    setMostrarSugestoes(false);
  };

  const handleRemoverItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      itensEspecificos: prev.itensEspecificos.filter(item => item.id !== itemId)
    }));
  };

  // Salvar markups no localStorage sempre que houver mudança
  useEffect(() => {
    localStorage.setItem(MARKUP_STORAGE_KEY, JSON.stringify(markups));
  }, [markups]);

  const abrirModal = (markup = null) => {
    if (markup) {
      setFormData({
        id: markup.id,
        titulo: markup.titulo,
        valor: markup.valor,
        aplicaTodosFornecedores: markup.aplicaTodosFornecedores,
        aplicaEspecificos: markup.aplicaEspecificos,
        itensEspecificos: markup.itensEspecificos || []
      });
    } else {
      setFormData({
        id: null,
        titulo: '',
        valor: '',
        aplicaTodosFornecedores: false,
        aplicaEspecificos: false,
        itensEspecificos: []
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFormData({
      id: null,
      titulo: '',
      valor: '',
      aplicaTodosFornecedores: false,
      aplicaEspecificos: false,
      itensEspecificos: []
    });
    setBuscaItem('');
    setSugestoes([]);
    setMostrarSugestoes(false);
  };

  const abrirModalExclusao = (id, titulo) => {
    setModalExclusao({
      isOpen: true,
      markupId: id,
      markupTitulo: titulo
    });
  };

  const fecharModalExclusao = () => {
    setModalExclusao({
      isOpen: false,
      markupId: null,
      markupTitulo: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar valor do markup
    let valorFormatado = formData.valor.trim();
    if (!valorFormatado.endsWith('%')) {
      const fator = parseFloat(valorFormatado);
      if (!isNaN(fator)) {
        valorFormatado = `${((fator - 1) * 100).toFixed(0)}%`;
      }
    }

    const markupData = {
      ...formData,
      valor: valorFormatado
    };

    if (formData.id) {
      setMarkups(markups.map(m => 
        m.id === formData.id ? markupData : m
      ));
    } else {
      const novoId = Math.max(...markups.map(m => m.id), 0) + 1;
      setMarkups([...markups, { ...markupData, id: novoId }]);
    }

    fecharModal();
  };

  const handleDelete = () => {
    setMarkups(markups.filter(m => m.id !== modalExclusao.markupId));
    fecharModalExclusao();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'aplicaTodosFornecedores' || name === 'aplicaEspecificos') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Se estiver marcando "aplicaTodosFornecedores", limpa os itens específicos
        itensEspecificos: name === 'aplicaTodosFornecedores' && checked ? [] : prev.itensEspecificos
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Painel Markup</h1>
        <button
          onClick={() => abrirModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Novo Markup
        </button>
      </div>

      {/* Lista de Markups */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Markup</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aplicação</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {markups.map((markup) => (
              <tr key={markup.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{markup.titulo}</td>
                <td className="px-4 py-3 text-sm">{markup.valor}</td>
                <td className="px-4 py-3 text-sm">
                  {markup.aplicaTodosFornecedores 
                    ? 'Todos os fornecedores'
                    : `${markup.itensEspecificos.length} item(s) específico(s)`}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModal(markup)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => abrirModalExclusao(markup.id, markup.titulo)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.id ? 'Editar Markup' : 'Novo Markup'}
              </h3>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Markup</label>
                <input
                  type="text"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="Ex: 100% ou 2.35"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Digite a porcentagem (ex: 100%) ou o fator (ex: 2.35 para 135%)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="aplicaTodosFornecedores"
                    checked={formData.aplicaTodosFornecedores}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aplicar para todos os fornecedores
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="aplicaEspecificos"
                    checked={formData.aplicaEspecificos}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aplicar em itens específicos
                  </label>
                </div>
              </div>

              {formData.aplicaEspecificos && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Buscar SKU, Produto ou Fornecedor
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={buscaItem}
                        onChange={(e) => {
                          setBuscaItem(e.target.value);
                          setMostrarSugestoes(true);
                        }}
                        onFocus={() => setMostrarSugestoes(true)}
                        placeholder="Digite para buscar..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-4"
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      
                      {mostrarSugestoes && sugestoes.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {sugestoes.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelecionarItem(item)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium">{item.valor}</div>
                              <div className="text-sm text-gray-500">{item.descricao}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.itensEspecificos.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Itens Selecionados
                      </label>
                      <div className="space-y-2">
                        {formData.itensEspecificos.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                          >
                            <div>
                              <span className="font-medium">{item.valor}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({item.tipo === 'sku' ? 'SKU' : 'Fornecedor'})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoverItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {formData.id ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalExclusao.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
              <button
                onClick={fecharModalExclusao}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o markup "{modalExclusao.markupTitulo}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={fecharModalExclusao}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelMarkup; 