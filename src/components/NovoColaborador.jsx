import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { colaboradoresService, cargosService } from '../services/database';

function NovoColaborador() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cargo: '',
    status: 'Ativo',
    dataEntrada: '',
    dataSaida: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [cargosAtivos, setCargosAtivos] = useState([]);

  // Carregar cargos ativos do Firestore
  useEffect(() => {
    const carregarCargosAtivos = async () => {
      try {
        const cargos = await cargosService.buscarTodos();
        const cargosAtivos = cargos.filter(cargo => cargo.status === 'Ativo');
        console.log('Cargos ativos carregados:', cargosAtivos);
        setCargosAtivos(cargosAtivos);
      } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        setCargosAtivos([]);
      }
    };
    carregarCargosAtivos();
  }, []);

  useEffect(() => {
    if (id) {
      // Carregar dados do colaborador do Firestore se estiver editando
      const carregarColaborador = async () => {
        try {
          console.log('Carregando colaborador para edição, ID:', id);
          const colaborador = await colaboradoresService.buscarPorId(id);
          if (colaborador) {
            console.log('Colaborador encontrado:', colaborador);
            const { senha, ...dadosColaborador } = colaborador;
            setFormData({ ...dadosColaborador, senha: '' });
          } else {
            console.log('Colaborador não encontrado');
          }
        } catch (error) {
          console.error('Erro ao carregar colaborador:', error);
        }
      };
      carregarColaborador();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.celular || !formData.cargo || !formData.dataEntrada) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!id && !formData.senha) {
      alert('Por favor, defina uma senha de acesso.');
      return;
    }
    
    console.log('Dados a serem salvos:', formData);
    
    try {
      if (id) {
        console.log('Atualizando colaborador existente...');
        await colaboradoresService.atualizar(id, formData);
        console.log('Colaborador atualizado com sucesso');
      } else {
        console.log('Criando novo colaborador...');
        const novoId = await colaboradoresService.salvar(formData);
        console.log('Colaborador criado com ID:', novoId);
      }
      
      console.log('Navegando para /colaboradores...');
      navigate('/colaboradores');
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      alert(`Erro ao salvar colaborador: ${error.message || error}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {id ? 'Editar Colaborador' : 'Novo Colaborador'}
        </h1>
        <button
          onClick={() => navigate('/colaboradores')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <FaTimes /> Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
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
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular *
            </label>
            <input
              type="tel"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo *
            </label>
            <select
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um cargo</option>
              {cargosAtivos.map(cargo => (
                <option key={cargo.id} value={cargo.nome}>
                  {cargo.nome}
                </option>
              ))}
            </select>
            {cargosAtivos.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Nenhum cargo ativo cadastrado. <button
                  type="button"
                  onClick={() => navigate('/cargos/novo')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Cadastrar novo cargo
                </button>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha de Acesso {!id && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!id}
                placeholder={id ? "Deixe em branco para manter a senha atual" : "Digite a senha de acesso"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {id && (
              <p className="mt-1 text-sm text-gray-500">
                Deixe em branco para manter a senha atual
              </p>
            )}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Entrada *
            </label>
            <input
              type="date"
              name="dataEntrada"
              value={formData.dataEntrada}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Saída
            </label>
            <input
              type="date"
              name="dataSaida"
              value={formData.dataSaida}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={formData.status === 'Ativo'}
            />
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

export default NovoColaborador; 