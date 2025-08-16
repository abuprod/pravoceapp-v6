import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaClipboardList, 
  FaUsers,
  FaBox,
  FaTruck,
  FaChartBar
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: <FaHome className="w-5 h-5" />,
      label: 'Dashboard'
    },
    {
      path: '/pedidos-venda',
      icon: <FaShoppingCart className="w-5 h-5" />,
      label: 'Pedidos de Venda'
    },
    {
      path: '/ordens-compra',
      icon: <FaClipboardList className="w-5 h-5" />,
      label: 'Ordens de Compra'
    },
    {
      path: '/cadastro-cliente',
      icon: <FaUsers className="w-5 h-5" />,
      label: 'Clientes'
    },
    {
      path: '/produtos',
      icon: <FaBox className="w-5 h-5" />,
      label: 'Produtos'
    },
    {
      path: '/fornecedores',
      icon: <FaTruck className="w-5 h-5" />,
      label: 'Fornecedores'
    },
    {
      path: '/relatorios',
      icon: <FaChartBar className="w-5 h-5" />,
      label: 'Relatórios'
    }
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold">Pra Você</h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              location.pathname === item.path ? 'bg-gray-700 text-white' : ''
            }`}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 