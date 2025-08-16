# 🚀 Instruções para Deploy Online

## 📋 O que você precisa fazer:

### 1. **Configurar Firebase (Database)**

1. Acesse: https://console.firebase.google.com/
2. Clique em "Criar projeto"
3. Digite um nome para seu projeto (ex: "sistema-moveis")
4. Siga os passos (pode desabilitar Google Analytics)
5. No painel, clique em "Firestore Database"
6. Clique em "Criar banco de dados"
7. Escolha "Iniciar no modo de teste" (gratuito)
8. Escolha uma localização (ex: us-central1)

### 2. **Obter Credenciais do Firebase**

1. No painel do Firebase, clique na engrenagem ⚙️
2. Clique em "Configurações do projeto"
3. Role para baixo e clique em "Adicionar app"
4. Escolha o ícone da web (</>)
5. Digite um nome (ex: "sistema-moveis-web")
6. Clique em "Registrar app"
7. **COPIE as credenciais** que aparecem

### 3. **Configurar Credenciais no Código**

1. Abra o arquivo `src/firebase/config.js`
2. Substitua as credenciais falsas pelas reais do Firebase:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-real",
  authDomain: "seu-projeto-real.firebaseapp.com",
  projectId: "seu-projeto-real",
  storageBucket: "seu-projeto-real.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id-real"
};
```

### 4. **Deploy no Vercel (Gratuito)**

1. Acesse: https://vercel.com/
2. Clique em "Sign up" e crie uma conta (pode usar GitHub)
3. Clique em "New Project"
4. Conecte seu repositório GitHub (se não tiver, crie um)
5. Selecione o repositório do seu projeto
6. Clique em "Deploy"

**Pronto!** Seu sistema estará online em alguns minutos.

## 🔗 Links Úteis:

- **Firebase Console**: https://console.firebase.google.com/
- **Vercel**: https://vercel.com/
- **GitHub**: https://github.com/ (para criar repositório)

## 💰 Custos:

- **Firebase**: Gratuito até 50.000 leituras/dia
- **Vercel**: Gratuito para projetos pessoais
- **Total**: $0 por mês

## 🎯 Próximos Passos:

1. Configure o Firebase
2. Atualize as credenciais no código
3. Faça o deploy no Vercel
4. Teste o sistema online
5. Compartilhe o link com sua equipe

## ❓ Precisa de Ajuda?

Se tiver dúvidas em qualquer etapa, me avise! Vou te ajudar a configurar tudo. 