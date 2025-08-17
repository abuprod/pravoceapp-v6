// Script para corrigir o JSX
const fs = require('fs');

const filePath = 'src/components/NovaOrdemCompra.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Localizar e corrigir a primeira ocorrência
const lines = content.split('\n');
let fixed = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</div>') && 
      i + 2 < lines.length && 
      lines[i + 2].includes('{/* Totais */}') && 
      !fixed) {
    // Adicionar o fechamento da condição
    lines[i] = lines[i] + '\n            )}';
    fixed = true;
    break;
  }
}

if (fixed) {
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Arquivo corrigido com sucesso!');
} else {
  console.log('Não foi possível encontrar o local para corrigir.');
}
