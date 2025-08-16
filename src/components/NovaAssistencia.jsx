import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaTools, FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';

function NovaAssistencia() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const statusOptions = [
    { nome: 'EM ABERTO', cor: 'Amarelo', hex: '#FFEB3B' },
    { nome: 'ENVIADA', cor: 'Roxo', hex: '#9C27B0' },
    { nome: 'ENCOMENDADA', cor: 'Turquesa', hex: '#00B8A9' },
    { nome: 'VISITA TÉC.', cor: 'Magenta escuro', hex: '#C2185B' },
    { nome: 'AGENDAR', cor: 'Laranja', hex: '#FF9800' },
    { nome: 'AGENDADA', cor: 'Azul claro', hex: '#2196F3' },
    { nome: 'CONCLUÍDA', cor: 'Verde', hex: '#4CAF50' },
    { nome: 'CANCELADA', cor: 'Vermelho', hex: '#F44336' },
    { nome: 'AGUARDANDO ALGO', cor: 'Cinza', hex: '#9E9E9E' },
    { nome: 'INDEFINIDO', cor: 'Marrom', hex: '#795548' }
  ];

  const [formData, setFormData] = useState({
    dataAbertura: '',
    status: 'EM ABERTO',
    pedido: '',
    oc: '',
    vendedor: '',
    cliente: '',
    fabrica: '',
    itensReclamacao: '',
    reclamacao: '',
    observacoesInternas: '',
    dataCompra: '',
    dataEntrega: '',
    envioFabrica: '',
    agendadoPara: '',
    dataConclusao: ''
  });

  const [ocorrencias, setOcorrencias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState(null);
  const [modalData, setModalData] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  });

  useEffect(() => {
    if (isEditing) {
      // Simular carregamento de dados existentes
      setFormData({
        dataAbertura: '01/01/2024',
        status: 'EM ABERTO',
        pedido: 'PED-001',
        oc: 'OC-001',
        vendedor: 'João Silva',
        cliente: 'Cliente Exemplo',
        fabrica: 'Fábrica XYZ',
        itensReclamacao: 'Produto A - Qtd: 1',
        reclamacao: 'Produto não liga',
        observacoesInternas: 'Cliente relatou que o produto parou de funcionar após 2 meses',
        dataCompra: '01/11/2023',
        dataEntrega: '15/11/2023',
        envioFabrica: '10/01/2024',
        agendadoPara: '20/01/2024',
        dataConclusao: ''
      });
      
      // Simular ocorrências existentes
      setOcorrencias([
        {
          id: 1,
          data: '05/01/2024',
          descricao: 'Contato inicial com o cliente realizado'
        },
        {
          id: 2,
          data: '10/01/2024',
          descricao: 'Produto enviado para a fábrica'
        }
      ]);
    } else {
      // Definir data de abertura como hoje para novas assistências
      const hoje = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dataAbertura: hoje }));
    }
  }, [isEditing, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aqui você implementaria a lógica para salvar no banco de dados
    console.log('Dados da assistência:', formData);
    console.log('Ocorrências:', ocorrencias);
    
    alert(isEditing ? 'Assistência técnica atualizada com sucesso!' : 'Assistência técnica criada com sucesso!');
    navigate('/assistencias');
  };

  const abrirModal = (ocorrencia = null) => {
    if (ocorrencia) {
      // Modo edição
      setEditingOcorrencia(ocorrencia);
      setModalData({
        data: ocorrencia.data,
        descricao: ocorrencia.descricao
      });
    } else {
      // Modo adição
      setEditingOcorrencia(null);
      setModalData({
        data: new Date().toISOString().split('T')[0],
        descricao: ''
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingOcorrencia(null);
    setModalData({
      data: new Date().toISOString().split('T')[0],
      descricao: ''
    });
  };

  const salvarOcorrencia = () => {
    if (modalData.descricao.trim()) {
      if (editingOcorrencia) {
        // Atualizar ocorrência existente
        setOcorrencias(prev => prev.map(ocorrencia => 
          ocorrencia.id === editingOcorrencia.id 
            ? { ...ocorrencia, data: modalData.data, descricao: modalData.descricao }
            : ocorrencia
        ));
      } else {
        // Adicionar nova ocorrência
        const novaOcorrencia = {
          id: Date.now(),
          data: modalData.data,
          descricao: modalData.descricao
        };
        setOcorrencias(prev => [...prev, novaOcorrencia]);
      }
      fecharModal();
    }
  };

  const removerOcorrencia = (id) => {
    setOcorrencias(prev => prev.filter(ocorrencia => ocorrencia.id !== id));
  };

  const getStatusColor = (statusNome) => {
    const status = statusOptions.find(s => s.nome === statusNome);
    return status ? status.hex : '#9E9E9E';
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/assistencias')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaTools className="text-blue-600" />
          {isEditing ? 'Editar Assistência Técnica' : 'Nova Assistência Técnica'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Seção 1: Informações Básicas */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
            Informações Básicas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Data de Abertura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Abertura *
              </label>
              <input
                type="date"
                name="dataAbertura"
                value={formData.dataAbertura}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status.nome} value={status.nome}>
                    {status.nome}
                  </option>
                ))}
              </select>
              {/* Etiqueta de status */}
              <div className="mt-2">
                <span
                  className="inline-block px-3 py-1 text-xs font-semibold rounded-full text-white"
                  style={{ backgroundColor: getStatusColor(formData.status) }}
                >
                  {formData.status}
                </span>
              </div>
            </div>

            {/* Pedido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedido *
              </label>
              <input
                type="text"
                name="pedido"
                value={formData.pedido}
                onChange={handleChange}
                required
                placeholder="Ex: PED-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OC
              </label>
              <input
                type="text"
                name="oc"
                value={formData.oc}
                onChange={handleChange}
                placeholder="Ex: OC-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vendedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendedor
              </label>
              <input
                type="text"
                name="vendedor"
                value={formData.vendedor}
                onChange={handleChange}
                placeholder="Nome do vendedor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <input
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Detalhes da Assistência */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
            Detalhes da Assistência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fábrica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fábrica
              </label>
              <input
                type="text"
                name="fabrica"
                value={formData.fabrica}
                onChange={handleChange}
                placeholder="Nome da fábrica"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Itens/Qtd da reclamação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itens/Qtd da Reclamação
              </label>
              <input
                type="text"
                name="itensReclamacao"
                value={formData.itensReclamacao}
                onChange={handleChange}
                placeholder="Ex: Produto A - Qtd: 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Campos de texto longo */}
          <div className="mt-6 space-y-6">
            {/* Reclamação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reclamação *
              </label>
              <textarea
                name="reclamacao"
                value={formData.reclamacao}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Descreva detalhadamente a reclamação do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Observações Internas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Internas
              </label>
              <textarea
                name="observacoesInternas"
                value={formData.observacoesInternas}
                onChange={handleChange}
                rows="4"
                placeholder="Observações internas sobre a assistência técnica"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Ocorrências */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
            Ocorrências
          </h2>
          
          {/* Lista de ocorrências */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700">Histórico de Ocorrências</h3>
              <button
                type="button"
                onClick={() => abrirModal()}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <FaPlus size={12} />
                Nova Ocorrência
              </button>
            </div>
            
            {ocorrencias.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {ocorrencias.map((ocorrencia) => (
                  <div key={ocorrencia.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-600">{ocorrencia.data}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => abrirModal(ocorrencia)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                            title="Editar"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removerOcorrencia(ocorrencia.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Excluir"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{ocorrencia.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Nenhuma ocorrência registrada</p>
            )}
          </div>
        </div>

        {/* Seção 4: Datas */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">
            Datas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Data da Compra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Compra
              </label>
              <input
                type="date"
                name="dataCompra"
                value={formData.dataCompra}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data da Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Entrega
              </label>
              <input
                type="date"
                name="dataEntrega"
                value={formData.dataEntrega}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Envio p/ Fábrica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Envio p/ Fábrica
              </label>
              <input
                type="date"
                name="envioFabrica"
                value={formData.envioFabrica}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Agendado para */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agendado para
              </label>
              <input
                type="date"
                name="agendadoPara"
                value={formData.agendadoPara}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data da Conclusão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Conclusão
              </label>
              <input
                type="date"
                name="dataConclusao"
                value={formData.dataConclusao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/assistencias')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaSave />
            {isEditing ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Modal de Ocorrência */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingOcorrencia ? 'Editar Ocorrência' : 'Nova Ocorrência'}
              </h3>
              <button
                onClick={fecharModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={modalData.data}
                  onChange={(e) => setModalData(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={modalData.descricao}
                  onChange={(e) => setModalData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows="4"
                  placeholder="Descreva a ocorrência..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={fecharModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarOcorrencia}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NovaAssistencia; 