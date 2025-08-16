# Script para configurar GitHub CLI e criar repositório
Write-Host "=== Configuração do GitHub CLI ===" -ForegroundColor Green

# Verificar se o GitHub CLI já está instalado
try {
    $ghVersion = gh --version
    Write-Host "GitHub CLI já está instalado: $ghVersion" -ForegroundColor Yellow
} catch {
    Write-Host "GitHub CLI não encontrado. Instalando..." -ForegroundColor Yellow
    
    # Baixar e instalar GitHub CLI
    $url = "https://github.com/cli/cli/releases/latest/download/gh_2.40.1_windows_amd64.msi"
    $output = "gh-installer.msi"
    
    Write-Host "Baixando GitHub CLI..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $output
    
    Write-Host "Instalando GitHub CLI..." -ForegroundColor Cyan
    Start-Process msiexec.exe -Wait -ArgumentList "/i $output /quiet"
    
    # Limpar arquivo de instalação
    Remove-Item $output
    
    Write-Host "GitHub CLI instalado com sucesso!" -ForegroundColor Green
}

# Aguardar um pouco para o PATH ser atualizado
Start-Sleep -Seconds 3

# Verificar se o usuário está logado no GitHub
try {
    $user = gh auth status --user
    Write-Host "Usuário logado: $user" -ForegroundColor Green
} catch {
    Write-Host "Você precisa fazer login no GitHub CLI." -ForegroundColor Yellow
    Write-Host "Execute: gh auth login" -ForegroundColor Cyan
    Write-Host "Depois execute este script novamente." -ForegroundColor Cyan
    exit 1
}

# Criar repositório no GitHub
Write-Host "Criando repositório no GitHub..." -ForegroundColor Cyan

$repoName = "pravoceapp-v5"
$description = "Sistema de Gestão Empresarial - PraVocê App v5"

try {
    gh repo create $repoName --description $description --public --source=. --remote=origin --push
    Write-Host "Repositório criado com sucesso!" -ForegroundColor Green
    Write-Host "URL: https://github.com/$user/$repoName" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao criar repositório. Verifique se você tem permissões." -ForegroundColor Red
    Write-Host "Você pode criar manualmente em: https://github.com/new" -ForegroundColor Yellow
}

Write-Host "=== Configuração concluída ===" -ForegroundColor Green 