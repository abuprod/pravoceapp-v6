import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaBox, 
  FaUsers, 
  FaWarehouse,
  FaTools,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaTable,
  FaBook,
  FaBell,
  FaMapMarkerAlt,
  FaBars,
  FaTimes,
  FaCalculator,
  FaChartBar
} from 'react-icons/fa';
// Logo será carregado da pasta public

const MenuLateral = () => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatingMenu, setFloatingMenu] = useState(null);
  const [floatingMenuPosition, setFloatingMenuPosition] = useState({ x: 0, y: 0 });
  const location = useLocation();
  const menuRef = useRef(null);

  const menuItems = [
    { path: '/', label: 'Início', icon: <FaHome /> },
    { path: '/pedidos-venda', label: 'Pedidos de Venda', icon: <FaShoppingCart /> },
    { path: '/ordens-compra', label: 'Ordens de Compra', icon: <FaBox /> },
    { 
      path: '/cadastros', 
      label: 'Cadastros', 
      icon: <FaUsers />,
      subItems: [
        { path: '/produtos', label: 'Produtos' },
        { path: '/cadastro-cliente', label: 'Clientes' },
        { path: '/fornecedores', label: 'Fornecedores' },
        { path: '/colaboradores', label: 'Colaboradores' },
        { path: '/cargos', label: 'Cargos' },
        { path: '/locais', label: 'Locais', icon: <FaMapMarkerAlt /> }
      ]
    },
    { path: '/estoque', label: 'Estoque', icon: <FaWarehouse /> },
    { path: '/assistencias', label: 'Assistências Técnicas', icon: <FaTools /> },
    { path: '/orcamentos', label: 'Orçamentos', icon: <FaCalculator /> },
    { path: '/controle-fluxo', label: 'Controle de Fluxo', icon: <FaChartBar /> },
    { path: '/contas', label: 'Contas a Pagar e Receber', icon: <FaMoneyBillWave /> },
    { path: '/markup', label: 'Painel Markup', icon: <FaChartLine /> },
    { path: '/prazos', label: 'Prazos de Pagamento', icon: <FaCalendarAlt /> },
    { path: '/relatorios', label: 'Relatórios', icon: <FaFileAlt /> },
    { path: '/fornecedores/tabelas', label: 'Tabelas de Fornecedores', icon: <FaTable /> },
    { path: '/fornecedores/catalogos', label: 'Catálogos de Fornecedores', icon: <FaBook /> },
    { path: '/fornecedores/avisos', label: 'Avisos de Fornecedores', icon: <FaBell /> }
  ];

  const toggleMenu = (path) => {
    if (isMinimized) {
      // Na versão minimizada, mostra o menu flutuante
      const menuItem = menuItems.find(item => item.path === path);
      if (menuItem && menuItem.subItems) {
        setFloatingMenu(menuItem);
      }
    } else {
      // Na versão expandida, expande/colapsa normalmente
      setExpandedMenus(prev => ({
        ...prev,
        [path]: !prev[path]
      }));
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    setFloatingMenu(null); // Fecha o menu flutuante ao minimizar/expandir
  };

  const handleItemClick = (event, item) => {
    if (isMinimized && item.subItems) {
      // Calcula a posição do menu flutuante
      const rect = event.currentTarget.getBoundingClientRect();
      setFloatingMenuPosition({
        x: rect.right + 10,
        y: rect.top
      });
      setFloatingMenu(item);
    } else if (!isMinimized && item.subItems) {
      // Na versão expandida, expande/colapsa o submenu
      toggleMenu(item.path);
    }
  };

  const closeFloatingMenu = () => {
    setFloatingMenu(null);
  };

  // Fecha o menu flutuante quando clica fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        // Verifica se o clique não foi em um elemento do menu flutuante
        const floatingMenuElement = document.querySelector('.floating-menu');
        if (floatingMenuElement && !floatingMenuElement.contains(event.target)) {
          closeFloatingMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [floatingMenu]);

  return (
    <>
      <div ref={menuRef} className={`menu-lateral ${isMinimized ? 'minimized' : ''}`}>
        <div className="p-4 sticky top-0 bg-white z-10 border-b flex items-center justify-between">
          {!isMinimized && (
            <img src="/pravoce-sem-fundo.png" alt="PraVocê Logo" className="h-12 w-auto" />
          )}
          <button
            onClick={toggleMinimize}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isMinimized ? "Expandir menu" : "Minimizar menu"}
          >
            {isMinimized ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        <nav className="mt-4 pb-4 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={(e) => handleItemClick(e, item)}
                    className={`menu-item w-full text-left ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                    title={isMinimized ? item.label : ''}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {!isMinimized && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <span className="ml-2">
                          {expandedMenus[item.path] ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      </>
                    )}
                  </button>
                  
                  {!isMinimized && expandedMenus[item.path] && (
                    <div className="ml-8 mt-2">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`menu-item ${location.pathname === subItem.path ? 'active' : ''}`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                  title={isMinimized ? item.label : ''}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!isMinimized && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Menu Flutuante */}
      {floatingMenu && isMinimized && (
        <div 
          className="floating-menu"
          style={{
            position: 'fixed',
            left: floatingMenuPosition.x,
            top: floatingMenuPosition.y,
            zIndex: 40
          }}
        >
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 py-2 min-w-48">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{floatingMenu.label}</h3>
            </div>
            {floatingMenu.subItems.map((subItem) => (
              <Link
                key={subItem.path}
                to={subItem.path}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setTimeout(() => closeFloatingMenu(), 100);
                }}
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MenuLateral; 