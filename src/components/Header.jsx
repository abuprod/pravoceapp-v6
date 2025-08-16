import React from 'react';

const Header = () => {
  return (
    <header className="flex justify-end items-center p-4">
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Usuário</span>
        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
      </div>
    </header>
  );
};

export default Header; 