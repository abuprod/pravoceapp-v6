// Script para verificar dados salvos no localStorage
console.log('🔍 Verificando dados salvos no localStorage...\n');

const prefix = 'pravoceapp_';
const colecoes = [
    'clientes',
    'produtos', 
    'fornecedores',
    'pedidos',
    'ordensCompra',
    'colaboradores',
    'cargos',
    'locais',
    'assistencias'
];

let totalDados = 0;

colecoes.forEach(colecao => {
    const chave = prefix + colecao;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        try {
            const items = JSON.parse(dados);
            console.log(`✅ ${colecao.toUpperCase()}: ${items.length} itens encontrados`);
            
            if (items.length > 0) {
                items.forEach(item => {
                    let nome = item.nome || item.titulo || item.descricao || `ID: ${item.id}`;
                    let data = new Date(item.dataCriacao).toLocaleDateString('pt-BR');
                    console.log(`   - ${nome} (criado em ${data})`);
                });
            }
            totalDados += items.length;
        } catch (error) {
            console.log(`❌ ${colecao.toUpperCase()}: Erro ao ler dados`);
        }
    } else {
        console.log(`❌ ${colecao.toUpperCase()}: Nenhum dado encontrado`);
    }
    console.log('');
});

console.log(`📊 TOTAL: ${totalDados} itens salvos no localStorage`);

if (totalDados > 0) {
    console.log('✅ Seus dados estão salvos e disponíveis!');
} else {
    console.log('❌ Nenhum dado encontrado. Os dados podem ter sido perdidos.');
} 