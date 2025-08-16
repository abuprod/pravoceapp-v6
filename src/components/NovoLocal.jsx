import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const NovoLocal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    status: 'Ativo',
    dataAbertura: new Date().toISOString().split('T')[0],
    dataFechamento: '',
    vendedores: [],
    observacoes: ''
  });

  const [vendedoresDisponiveis, setVendedoresDisponiveis] = useState([]);

  // Função para carregar vendedores ativos
  const carregarVendedoresAtivos = () => {
    const colaboradores = JSON.parse(localStorage.getItem('colaboradores') || '[]');
    const locais = JSON.parse(localStorage.getItem('locais') || '[]');
    
    // Filtrar apenas colaboradores ativos com cargos de vendedor ou gerente
    const vendedoresAtivos = colaboradores.filter(colaborador => 
      colaborador.status === 'Ativo' && 
      (colaborador.cargo?.toLowerCase().includes('vendedor') || 
       colaborador.cargo?.toLowerCase().includes('gerente'))
    );
    
    // Obter todos os vendedores já atribuídos a outros locais
    const vendedoresAtribuidos = new Set();
    locais.forEach(local => {
      // Se estiver editando, não considerar o local atual
      if (isEditMode && local.id === id) {
        return;
      }
      // Adicionar vendedores do local à lista de atribuídos
      if (local.vendedores && Array.isArray(local.vendedores)) {
        local.vendedores.forEach(vendedor => vendedoresAtribuidos.add(vendedor));
      }
    });
    
    // Filtrar vendedores que não estão atribuídos a outros locais
    const vendedoresDisponiveis = vendedoresAtivos
      .filter(vendedor => !vendedoresAtribuidos.has(vendedor.nome))
      .map(v => v.nome);
    
    setVendedoresDisponiveis(vendedoresDisponiveis);
  };

  // Carregar vendedores ao montar o componente
  useEffect(() => {
    carregarVendedoresAtivos();
  }, []);

  // Adicionar listener para mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'colaboradores' || e.key === 'locais') {
        carregarVendedoresAtivos();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      // Aqui você buscaria os dados do local do backend
      // Por enquanto, vamos usar dados mockados
      const localMock = {
        id: 1,
        nome: 'Loja Centro',
        sigla: 'LC',
        status: 'Ativo',
        dataAbertura: '2024-01-01',
        dataFechamento: '',
        vendedores: ['João Silva', 'Maria Santos'],
        observacoes: 'Loja principal'
      };
      setFormData(localMock);
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVendedorChange = (vendedor) => {
    setFormData(prev => ({
      ...prev,
      vendedores: prev.vendedores.includes(vendedor)
        ? prev.vendedores.filter(v => v !== vendedor)
        : [...prev.vendedores, vendedor]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Gerar um ID único para o novo local
    const novoLocal = {
      ...formData,
      id: Date.now().toString(), // Usando timestamp como ID único
    };

    // Buscar locais existentes do localStorage
    const locaisExistentes = JSON.parse(localStorage.getItem('locais') || '[]');
    
    // Adicionar o novo local à lista
    const novosLocais = [...locaisExistentes, novoLocal];
    
    // Salvar no localStorage
    localStorage.setItem('locais', JSON.stringify(novosLocais));

    // Navegar de volta para a lista de locais
    navigate('/locais');
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/locais')}
          className="text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Editar Local' : 'Novo Local'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Nome do Local */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome do Local *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Sigla */}
          <div>
            <label htmlFor="sigla" className="block text-sm font-medium text-gray-700">
              Sigla *
            </label>
            <input
              type="text"
              id="sigla"
              name="sigla"
              value={formData.sigla}
              onChange={handleChange}
              required
              maxLength={5}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
              style={{ textTransform: 'uppercase' }}
            />
            <p className="mt-1 text-sm text-gray-500">Máximo de 5 caracteres</p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          {/* Data de Abertura */}
          <div>
            <label htmlFor="dataAbertura" className="block text-sm font-medium text-gray-700">
              Data de Abertura *
            </label>
            <input
              type="date"
              id="dataAbertura"
              name="dataAbertura"
              value={formData.dataAbertura}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Data de Fechamento */}
          <div>
            <label htmlFor="dataFechamento" className="block text-sm font-medium text-gray-700">
              Data de Fechamento
            </label>
            <input
              type="date"
              id="dataFechamento"
              name="dataFechamento"
              value={formData.dataFechamento}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Vendedores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendedores
            </label>
            {vendedoresDisponiveis.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {vendedoresDisponiveis.map(vendedor => (
                  <label key={vendedor} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.vendedores.includes(vendedor)}
                      onChange={() => handleVendedorChange(vendedor)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{vendedor}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>Nenhum vendedor disponível encontrado.</p>
                <p className="mt-1">
                  Isso pode acontecer por dois motivos:
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Não há colaboradores ativos com cargos de "Vendedor" ou "Gerente"</li>
                  <li>Todos os vendedores ativos já estão atribuídos a outros locais</li>
                </ul>
                <p className="mt-2">
                  Para adicionar vendedores, cadastre colaboradores com cargos de "Vendedor" ou "Gerente" 
                  e status "Ativo" na seção de Colaboradores.
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/locais')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaSave /> Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NovoLocal; 