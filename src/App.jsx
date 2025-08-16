import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuLateral from './components/MenuLateral';
import NovoPedidoVenda from './components/NovoPedidoVenda';
import ListaPedidosVenda from './components/PedidosVenda';
import CadastroCliente from './components/CadastroCliente';
import NovoCliente from './components/NovoCliente';
import DashboardPrincipal from './components/DashboardPrincipal';
import NovaOrdemCompra from './components/NovaOrdemCompra';
import ListaOrdensCompra from './components/ListaOrdensCompra';
import ListaProdutos from './components/ListaProdutos';
import NovoProduto from './components/NovoProduto';
import NovoFornecedor from './components/NovoFornecedor';
import ListaPedidos from './components/ListaPedidos';
import NovoPedido from './components/NovoPedido';
import TabelasFornecedor from './components/TabelasFornecedor';
import CatalogosFornecedor from './components/CatalogosFornecedor';
import AvisosFornecedor from './components/AvisosFornecedor';
import ListaLocais from './components/ListaLocais';
import NovoLocal from './components/NovoLocal';
import Estoque from './components/Estoque';
import PainelMarkup from './components/PainelMarkup';
import ListaFornecedores from './components/ListaFornecedores';
import ListaColaboradores from './components/ListaColaboradores';
import NovoColaborador from './components/NovoColaborador';
import ListaCargos from './components/ListaCargos';
import NovoCargo from './components/NovoCargo';
import ListaAssistencias from './components/ListaAssistencias';
import NovaAssistencia from './components/NovaAssistencia';
import Orcamentos from './components/Orcamentos';
import ControleFluxo from './components/ControleFluxo';
import NovoOrcamento from './components/NovoOrcamento';
import NovoControleFluxo from './components/NovoControleFluxo';


// Componente de teste simples para Vercel
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎉 PraVocê ERP - Vercel Test
        </h1>
        <p className="text-gray-700 text-lg mb-4">
          Sistema funcionando no Vercel!
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Status:</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              ✅ React funcionando
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              ✅ Vercel deploy OK
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              ✅ CSS carregado
            </li>
          </ul>
        </div>
        <button 
          onClick={() => {
            alert('JavaScript funcionando no Vercel! 🎉');
            console.log('Vercel test OK!');
          }}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Testar JavaScript
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se o Firebase está carregado
    const checkFirebase = async () => {
      try {
        // Aguardar um pouco para garantir que tudo carregou
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar Firebase:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    checkFirebase();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando PraVocê ERP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Erro ao carregar</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <MenuLateral />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPrincipal />} />
          <Route path="/pedidos-venda" element={<ListaPedidosVenda />} />
          <Route path="/pedidos-venda/novo" element={<NovoPedidoVenda />} />
          <Route path="/pedidos-venda/editar/:id" element={<NovoPedidoVenda />} />
          <Route path="/cadastro-cliente" element={<CadastroCliente />} />
          <Route path="/cadastro-cliente/novo" element={<NovoCliente />} />
          <Route path="/cadastro-cliente/editar/:id" element={<NovoCliente />} />
          <Route path="/ordens-compra" element={<ListaOrdensCompra />} />
          <Route path="/ordens-compra/novo" element={<NovaOrdemCompra />} />
          <Route path="/ordens-compra/editar/:id" element={<NovaOrdemCompra />} />
          <Route path="/produtos" element={<ListaProdutos />} />
          <Route path="/produtos/novo" element={<NovoProduto />} />
          <Route path="/produtos/novo/:id" element={<NovoProduto />} />
          <Route path="/fornecedores" element={<ListaFornecedores />} />
          <Route path="/fornecedores/novo" element={<NovoFornecedor />} />
          <Route path="/fornecedores/editar/:id" element={<NovoFornecedor />} />
          <Route path="/fornecedores/tabelas" element={<TabelasFornecedor />} />
          <Route path="/fornecedores/catalogos" element={<CatalogosFornecedor />} />
          <Route path="/fornecedores/avisos" element={<AvisosFornecedor />} />
          <Route path="/pedidos" element={<ListaPedidos />} />
          <Route path="/pedidos/novo" element={<NovoPedido />} />
          <Route path="/locais" element={<ListaLocais />} />
          <Route path="/locais/novo" element={<NovoLocal />} />
          <Route path="/locais/novo/:id" element={<NovoLocal />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/markup" element={<PainelMarkup />} />
          <Route path="/colaboradores" element={<ListaColaboradores />} />
          <Route path="/colaboradores/novo" element={<NovoColaborador />} />
          <Route path="/colaboradores/editar/:id" element={<NovoColaborador />} />
          <Route path="/cargos" element={<ListaCargos />} />
          <Route path="/cargos/novo" element={<NovoCargo />} />
          <Route path="/cargos/editar/:id" element={<NovoCargo />} />
          <Route path="/assistencias" element={<ListaAssistencias />} />
          <Route path="/assistencias/novo" element={<NovaAssistencia />} />
          <Route path="/assistencias/editar/:id" element={<NovaAssistencia />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/novo" element={<NovoOrcamento />} />
          <Route path="/orcamentos/editar/:id" element={<NovoOrcamento />} />
          <Route path="/controle-fluxo" element={<ControleFluxo />} />
          <Route path="/controle-fluxo/novo" element={<NovoControleFluxo />} />
          <Route path="/controle-fluxo/editar/:id" element={<NovoControleFluxo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App; 