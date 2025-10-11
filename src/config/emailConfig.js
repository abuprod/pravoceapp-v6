// Configuração do EmailJS para envio de Ordens de Compra
// 
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 
// 1. Crie uma conta gratuita em: https://www.emailjs.com
// 2. Conecte seu Gmail ao EmailJS:
//    - Vá em "Email Services" > "Add New Service"
//    - Escolha "Gmail"
//    - Faça login com sua conta Google
// 
// 3. Crie um template de email:
//    - Vá em "Email Templates" > "Create New Template"
//    - Configure o template com as seguintes variáveis:
//      * Subject: Nova Ordem de Compra #{{oc_numero}}
//      * Body (HTML):
//        ```
//        <p>Bom dia!</p>
//        <p>Segue nova solicitação de ordem de compra em anexo!</p>
//        <br>
//        <p><strong>OC:</strong> {{oc_numero}}</p>
//        <p><strong>Fornecedor:</strong> {{fornecedor}}</p>
//        ```
//      * To Email: {{to_email}}
//      * Attachment: {{pdf_attachment}} (nome: {{pdf_name}})
// 
// 4. Copie as credenciais e cole abaixo:

export const emailConfig = {
  // ID do serviço de email (Service ID)
  serviceID: 'YOUR_SERVICE_ID',
  
  // ID do template de email (Template ID)
  templateID: 'YOUR_TEMPLATE_ID',
  
  // Chave pública (Public Key)
  publicKey: 'YOUR_PUBLIC_KEY'
};

// Para obter essas informações:
// - Service ID: Na página "Email Services", clique no serviço criado
// - Template ID: Na página "Email Templates", clique no template criado
// - Public Key: Na página "Account" > "General"

