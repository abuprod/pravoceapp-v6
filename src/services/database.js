// Sistema de banco de dados local usando localStorage
class LocalDatabase {
  constructor() {
    this.prefix = 'pravoceapp_';
  }

  // Função genérica para salvar dados
  async salvarDados(colecao, dados) {
    try {
      const chave = this.prefix + colecao;
      const dadosExistentes = this.getData(chave, []);
      
      const novoItem = {
        id: this.gerarId(),
        ...dados,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      dadosExistentes.push(novoItem);
      this.saveData(chave, dadosExistentes);
      
      console.log('Dados salvos com sucesso:', novoItem);
      return novoItem.id;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      throw error;
    }
  }

  // Função genérica para atualizar dados
  async atualizarDados(colecao, id, dados) {
    try {
      const chave = this.prefix + colecao;
      const dadosExistentes = this.getData(chave, []);
      
      const index = dadosExistentes.findIndex(item => String(item.id) === String(id));
      if (index === -1) {
        throw new Error('Item não encontrado');
      }
      
      dadosExistentes[index] = {
        ...dadosExistentes[index],
        ...dados,
        dataAtualizacao: new Date().toISOString()
      };
      
      this.saveData(chave, dadosExistentes);
      console.log('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      throw error;
    }
  }

  // Função genérica para deletar dados
  async deletarDados(colecao, id) {
    try {
      const chave = this.prefix + colecao;
      const dadosExistentes = this.getData(chave, []);
      
      const dadosFiltrados = dadosExistentes.filter(item => String(item.id) !== String(id));
      this.saveData(chave, dadosFiltrados);
      
      console.log('Dados deletados com sucesso');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      throw error;
    }
  }

  // Função genérica para buscar todos os dados
  async buscarTodos(colecao) {
    try {
      const chave = this.prefix + colecao;
      const dados = this.getData(chave, []);
      console.log(`Buscando todos os ${colecao}:`, dados);
      return dados;
    } catch (error) {
      console.error('Erro ao buscar:', error);
      throw error;
    }
  }

  // Função genérica para buscar por ID
  async buscarPorId(colecao, id) {
    try {
      const chave = this.prefix + colecao;
      const dadosExistentes = this.getData(chave, []);
      const item = dadosExistentes.find(item => String(item.id) === String(id));
      
      if (!item) {
        return null;
      }
      
      console.log(`Buscando ${colecao} por ID ${id}:`, item);
      return item;
    } catch (error) {
      console.error('Erro ao buscar por ID:', error);
      throw error;
    }
  }

  // Funções auxiliares
  getData(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Erro ao ler dados do localStorage:', error);
      return defaultValue;
    }
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
      throw error;
    }
  }

  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Instância global do banco de dados
const db = new LocalDatabase();

// Funções específicas para cada entidade
export const clientesService = {
  salvar: (dados) => db.salvarDados('clientes', dados),
  atualizar: (id, dados) => db.atualizarDados('clientes', id, dados),
  deletar: (id) => db.deletarDados('clientes', id),
  buscarTodos: () => db.buscarTodos('clientes'),
  buscarPorId: (id) => db.buscarPorId('clientes', id)
};

export const produtosService = {
  salvar: (dados) => db.salvarDados('produtos', dados),
  atualizar: (id, dados) => db.atualizarDados('produtos', id, dados),
  deletar: (id) => db.deletarDados('produtos', id),
  buscarTodos: () => db.buscarTodos('produtos'),
  buscarPorId: (id) => db.buscarPorId('produtos', id)
};

export const fornecedoresService = {
  salvar: (dados) => db.salvarDados('fornecedores', dados),
  atualizar: (id, dados) => db.atualizarDados('fornecedores', id, dados),
  deletar: (id) => db.deletarDados('fornecedores', id),
  buscarTodos: () => db.buscarTodos('fornecedores'),
  buscarPorId: (id) => db.buscarPorId('fornecedores', id)
};

export const pedidosService = {
  salvar: (dados) => db.salvarDados('pedidos', dados),
  atualizar: (id, dados) => db.atualizarDados('pedidos', id, dados),
  deletar: (id) => db.deletarDados('pedidos', id),
  buscarTodos: () => db.buscarTodos('pedidos'),
  buscarPorId: (id) => db.buscarPorId('pedidos', id)
};

export const ordensCompraService = {
  salvar: (dados) => db.salvarDados('ordensCompra', dados),
  atualizar: (id, dados) => db.atualizarDados('ordensCompra', id, dados),
  deletar: (id) => db.deletarDados('ordensCompra', id),
  buscarTodos: () => db.buscarTodos('ordensCompra'),
  buscarPorId: (id) => db.buscarPorId('ordensCompra', id)
};

export const colaboradoresService = {
  salvar: (dados) => db.salvarDados('colaboradores', dados),
  atualizar: (id, dados) => db.atualizarDados('colaboradores', id, dados),
  deletar: (id) => db.deletarDados('colaboradores', id),
  buscarTodos: () => db.buscarTodos('colaboradores'),
  buscarPorId: (id) => db.buscarPorId('colaboradores', id)
};

export const cargosService = {
  salvar: (dados) => db.salvarDados('cargos', dados),
  atualizar: (id, dados) => db.atualizarDados('cargos', id, dados),
  deletar: (id) => db.deletarDados('cargos', id),
  buscarTodos: () => db.buscarTodos('cargos'),
  buscarPorId: (id) => db.buscarPorId('cargos', id)
};

export const locaisService = {
  salvar: (dados) => db.salvarDados('locais', dados),
  atualizar: (id, dados) => db.atualizarDados('locais', id, dados),
  deletar: (id) => db.deletarDados('locais', id),
  buscarTodos: () => db.buscarTodos('locais'),
  buscarPorId: (id) => db.buscarPorId('locais', id)
};

export const assistenciasService = {
  salvar: (dados) => db.salvarDados('assistencias', dados),
  atualizar: (id, dados) => db.atualizarDados('assistencias', id, dados),
  deletar: (id) => db.deletarDados('assistencias', id),
  buscarTodos: () => db.buscarTodos('assistencias'),
  buscarPorId: (id) => db.buscarPorId('assistencias', id)
};

export const orcamentosService = {
  salvar: (dados) => db.salvarDados('orcamentos', dados),
  atualizar: (id, dados) => db.atualizarDados('orcamentos', id, dados),
  deletar: (id) => db.deletarDados('orcamentos', id),
  buscarTodos: () => db.buscarTodos('orcamentos'),
  buscarPorId: (id) => db.buscarPorId('orcamentos', id)
};

export const controleFluxoService = {
  salvar: (dados) => db.salvarDados('controleFluxo', dados),
  atualizar: (id, dados) => db.atualizarDados('controleFluxo', id, dados),
  deletar: (id) => db.deletarDados('controleFluxo', id),
  buscarTodos: () => db.buscarTodos('controleFluxo'),
  buscarPorId: (id) => db.buscarPorId('controleFluxo', id)
};

export const catalogosFornecedorService = {
  salvar: (dados) => db.salvarDados('catalogosFornecedor', dados),
  atualizar: (id, dados) => db.atualizarDados('catalogosFornecedor', id, dados),
  deletar: (id) => db.deletarDados('catalogosFornecedor', id),
  buscarTodos: () => db.buscarTodos('catalogosFornecedor'),
  buscarPorId: (id) => db.buscarPorId('catalogosFornecedor', id)
};

export const pedidosVendaService = {
  salvar: (dados) => db.salvarDados('pedidosVenda', dados),
  atualizar: (id, dados) => db.atualizarDados('pedidosVenda', id, dados),
  deletar: (id) => db.deletarDados('pedidosVenda', id),
  buscarTodos: () => db.buscarTodos('pedidosVenda'),
  buscarPorId: (id) => db.buscarPorId('pedidosVenda', id)
};

export const avisosFornecedorService = {
  salvar: (dados) => db.salvarDados('avisosFornecedor', dados),
  atualizar: (id, dados) => db.atualizarDados('avisosFornecedor', id, dados),
  deletar: (id) => db.deletarDados('avisosFornecedor', id),
  buscarTodos: () => db.buscarTodos('avisosFornecedor'),
  buscarPorId: (id) => db.buscarPorId('avisosFornecedor', id)
};

export const notificacoesFornecedorService = {
  salvar: (dados) => db.salvarDados('notificacoesFornecedor', dados),
  atualizar: (id, dados) => db.atualizarDados('notificacoesFornecedor', id, dados),
  deletar: (id) => db.deletarDados('notificacoesFornecedor', id),
  buscarTodos: () => db.buscarTodos('notificacoesFornecedor'),
  buscarPorId: (id) => db.buscarPorId('notificacoesFornecedor', id)
};

export const tabelasFornecedorService = {
  salvar: (dados) => db.salvarDados('tabelasFornecedor', dados),
  atualizar: (id, dados) => db.atualizarDados('tabelasFornecedor', id, dados),
  deletar: (id) => db.deletarDados('tabelasFornecedor', id),
  buscarTodos: () => db.buscarTodos('tabelasFornecedor'),
  buscarPorId: (id) => db.buscarPorId('tabelasFornecedor', id)
}; 