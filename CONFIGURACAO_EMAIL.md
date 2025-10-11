# Configuração de Envio de Ordens de Compra por Email

## Visão Geral

Este sistema permite o envio automático de Ordens de Compra (OC) por email para fornecedores, com PDF anexado.

## Recursos Implementados

### 1. OC de Estoque
- Botão "Enviar para a Fábrica" ao lado do botão Salvar
- Envia a OC completa em PDF para o email do fornecedor
- Muda status automaticamente para "Encomendado"
- Exibe a data de envio abaixo do botão

### 2. OC de Cliente
- Checkbox para selecionar itens individuais
- Botão mostra quantidade de itens selecionados: "(2) Enviar para a Fábrica"
- Agrupa itens por fornecedor e envia PDFs separados
- Marca cada item como encomendado individualmente
- Exibe datas de envio por produto

## Configuração do EmailJS

### Passo 1: Criar Conta no EmailJS

1. Acesse: https://www.emailjs.com
2. Clique em "Sign Up" e crie uma conta gratuita
3. Faça login na sua conta

### Passo 2: Conectar seu Gmail

1. No painel do EmailJS, vá em **Email Services**
2. Clique em **Add New Service**
3. Selecione **Gmail**
4. Clique em **Connect Account** e faça login com sua conta Google
5. Autorize o EmailJS a acessar sua conta
6. Dê um nome ao serviço (ex: "Gmail OC")
7. Clique em **Create Service**
8. **Copie o Service ID** (você vai precisar dele)

### Passo 3: Criar Template de Email

1. Vá em **Email Templates**
2. Clique em **Create New Template**
3. Configure o template:

**Template Settings:**
- **Template Name**: OC para Fornecedor
- **Subject**: `Nova Ordem de Compra #{{oc_numero}}`

**Email Content (HTML):**
```html
<p>Bom dia!</p>
<p>Segue nova solicitação de ordem de compra em anexo!</p>
<br>
<p><strong>OC:</strong> {{oc_numero}}</p>
<p><strong>Fornecedor:</strong> {{fornecedor}}</p>
```

**Template Variables:**
- To Email: `{{to_email}}`
- From Name: Seu nome ou nome da empresa
- Reply To: Seu email

4. Clique em **Save**
5. **Copie o Template ID** (você vai precisar dele)

### Passo 4: Obter Public Key

1. Vá em **Account** (ícone no canto superior direito)
2. Clique em **General**
3. Na seção **API Keys**, **copie a Public Key**

### Passo 5: Configurar no Sistema

1. Abra o arquivo: `src/config/emailConfig.js`
2. Substitua os valores pelas suas credenciais:

```javascript
export const emailConfig = {
  serviceID: 'seu_service_id_aqui',      // Service ID do Passo 2
  templateID: 'seu_template_id_aqui',    // Template ID do Passo 3
  publicKey: 'sua_public_key_aqui'       // Public Key do Passo 4
};
```

3. Salve o arquivo

## Como Usar

### Enviar OC de Estoque

1. Crie ou edite uma OC de estoque
2. Salve a OC
3. Clique no botão **"Enviar para a Fábrica"**
4. O sistema enviará automaticamente o email com o PDF anexado
5. A data de envio será exibida abaixo do botão

### Enviar OC de Cliente

1. Crie ou edite uma OC de cliente
2. Salve a OC
3. Selecione os itens que deseja enviar usando os checkboxes
4. Clique no botão **"(X) Enviar para a Fábrica"** (X = quantidade selecionada)
5. O sistema agrupa os itens por fornecedor e envia emails separados
6. As datas de envio serão exibidas por produto abaixo do botão

## Pré-requisitos

- Fornecedor deve ter **Email de Encomendas** cadastrado
- OC deve estar salva antes de enviar
- Conexão com internet ativa

## Limites do Plano Gratuito

O plano gratuito do EmailJS permite:
- **200 emails por mês**
- **Anexos de até 50KB por email**

Se precisar de mais, considere atualizar para um plano pago.

## Solução de Problemas

### Erro: "Fornecedor não possui email cadastrado"
- Verifique se o fornecedor tem o campo "Email de Encomendas" preenchido
- Vá em: Cadastros > Fornecedores > Editar fornecedor

### Erro: "Erro ao enviar email"
- Verifique se as credenciais do EmailJS estão corretas
- Verifique sua conexão com internet
- Verifique se não ultrapassou o limite de 200 emails/mês

### Email não chegou
- Verifique a pasta de SPAM do fornecedor
- Verifique se o email do fornecedor está correto
- Teste o template no painel do EmailJS

## Segurança

- As credenciais do EmailJS são armazenadas localmente no código
- Para produção, considere usar variáveis de ambiente
- O EmailJS usa criptografia SSL/TLS para envio de emails

## Suporte

Para mais informações sobre o EmailJS:
- Documentação: https://www.emailjs.com/docs/
- Suporte: https://www.emailjs.com/support/

