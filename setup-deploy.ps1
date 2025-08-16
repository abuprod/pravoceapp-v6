# Script para automatizar configuração do deploy
Write-Host "🚀 Configurando deploy do PraVocêApp..." -ForegroundColor Green

# Verificar se o Node.js está instalado
Write-Host "📋 Verificando dependências..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale em: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Build do projeto
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Configuração local concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Configure o Firebase: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Crie um projeto chamado 'pravoceapp'" -ForegroundColor White
Write-Host "3. Ative o Firestore Database" -ForegroundColor White
Write-Host "4. Obtenha as credenciais e atualize src/firebase/config.js" -ForegroundColor White
Write-Host "5. Faça deploy no Vercel: https://vercel.com/" -ForegroundColor White
Write-Host ""
Write-Host "📖 Instruções detalhadas estão no arquivo DEPLOY_INSTRUCTIONS.md" -ForegroundColor Yellow 