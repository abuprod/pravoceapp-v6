import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const FormularioCliente = ({ onClose, onClienteSalvo, clienteParaEditar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: ''
  });

  useEffect(() => {
    if (clienteParaEditar) {
      setFormData({
        nome: clienteParaEditar.nome,
        telefone: clienteParaEditar.telefone
      });
    }
  }, [clienteParaEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      alert('Por favor, preencha nome e telefone.');
      return;
    }

    // Aqui você implementaria a lógica para salvar o cliente
    // Por enquanto, vamos apenas passar os dados para o componente pai
    onClienteSalvo({
      id: clienteParaEditar ? clienteParaEditar.id : Date.now(),
      nome: formData.nome,
      telefone: formData.telefone
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
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

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {clienteParaEditar ? 'Salvar Alterações' : 'Adicionar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioCliente; 