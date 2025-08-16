import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';
import { cargosService } from '../services/database';
import { colaboradoresService } from '../services/database';

function NovoCargo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'Ativo'
  });
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState([]);

  useEffect(() => {
    if (id) {
      // Carregar dados do cargo se estiver editando
      const carregarCargo = async () => {
        try {
          const cargo = await cargosService.buscarPorId(id);
          if (cargo) {
            setFormData(cargo);
            // Buscar colaboradores que já estão vinculados a este cargo
            const colaboradoresVinculados = await buscarColaboradoresVinculados(cargo.nome);
            setColaboradoresSelecionados(colaboradoresVinculados);
          }
        } catch (error) {
          console.error('Erro ao carregar cargo:', error);
        }
      };
      carregarCargo();
    }
  }, [id]);

  // Função para buscar colaboradores vinculados ao cargo
  const buscarColaboradoresVinculados = async (nomeCargo) => {
    try {
      const todosColaboradores = await colaboradoresService.buscarTodos();
      return todosColaboradores.filter(colaborador => 
        colaborador.cargo === nomeCargo && colaborador.status === 'Ativo'
      );
    } catch (error) {
      console.error('Erro ao buscar colaboradores vinculados:', error);
      return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação dos dados
    if (!formData.nome || formData.nome.trim() === '') {
      alert('Por favor, preencha o nome do cargo.');
      return;
    }
    
    // Limpeza dos dados
    const dadosLimpos = {
      nome: formData.nome.trim(),
      descricao: formData.descricao ? formData.descricao.trim() : '',
      status: formData.status || 'Ativo'
    };
    
    try {
      if (id) {
        await cargosService.atualizar(id, dadosLimpos);
      } else {
        await cargosService.salvar(dadosLimpos);
      }
      
      navigate('/cargos');
    } catch (error) {
      console.error('Erro ao salvar cargo:', error);
      alert(`Erro ao salvar cargo: ${error.message || error}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Editar Cargo' : 'Novo Cargo'}
        </h1>
        <button
          onClick={() => navigate('/cargos')}
          className="text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cargo *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          {/* Seção de Colaboradores */}
          <div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Colaboradores do Cargo
              </label>
            </div>
            
            {colaboradoresSelecionados.length > 0 ? (
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                {colaboradoresSelecionados.map((colaborador) => (
                  <div key={colaborador.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">{colaborador.nome}</span>
                      <span className="text-sm text-gray-500 ml-2">({colaborador.email})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-4 text-center text-gray-500">
                Nenhum colaborador atribuído a este cargo
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaSave /> Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoCargo; 