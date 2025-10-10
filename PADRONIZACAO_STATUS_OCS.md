# 📋 Padronização de Status das Ordens de Compra

## 🎯 Objetivo
Padronizar os status das Ordens de Compra (OCs) para que os status compartilhados entre OCs de Cliente e OCs de Estoque tenham:
- ✅ Mesma descrição/label
- ✅ Mesmas cores  
- ✅ Mesmo valor interno (para facilitar filtros e evitar confusões)

## 📊 Status Padronizados

### Status de OCs de Estoque (6 status)
1. **Em aberto** - Amarelo
2. **Aprovado** - Verde
3. **Encomendado** - Azul
4. **Em depósito** - Roxo
5. **Cancelado** - Vermelho
6. **Outro (Ter obs)** - Cinza

### Status de OCs de Cliente (11 status)
Inclui todos os 6 de Estoque, mais:

7. **Aguardando outra OC** - Laranja
8. **Agendado** - Índigo
9. **Entregue Parcial** - Ciano
10. **Entregue** - Verde
11. **Não entregue (Ter obs)** - Vermelho

## 🔄 Mapeamento de Valores Internos

### Antes → Depois
- `"aberto"` → `"em_aberto"`
- `"deposito"` → `"em_deposito"`
- `"aprovado"` → `"aprovado"` (sem mudança)
- `"encomendado"` → `"encomendado"` (sem mudança)
- `"aguardando_outra_oc"` → `"aguardando_outra_oc"` (sem mudança)
- `"agendado"` → `"agendado"` (sem mudança)
- `"entregue_parcial"` → `"entregue_parcial"` (sem mudança)
- `"entregue"` → `"entregue"` (sem mudança)
- `"nao_entregue"` → `"nao_entregue"` (sem mudança)
- `"cancelado"` → `"cancelado"` (sem mudança)
- `"outro"` → `"outro"` (sem mudança)

## 📁 Arquivos Modificados

### 1. `src/components/NovaOrdemCompra.jsx`
**Alterações:**
- ✅ Padronizado valor padrão de status: `'aberto'` → `'em_aberto'`
- ✅ Atualizado `getStatusColor()` para usar novos valores internos
- ✅ Atualizado `getStatusLabel()` para exibir labels consistentes
- ✅ Corrigido dropdown de status para OCs de Cliente (11 opções)
- ✅ Corrigido dropdown de status para OCs de Estoque (6 opções)
- ✅ Labels padronizadas com capitalização correta

### 2. `src/components/ListaOrdensCompra.jsx`
**Alterações:**
- ✅ Padronizado array `statusOptions` com labels corretas
- ✅ Implementado `getStatusLabel()` para exibição consistente
- ✅ Atualizado `getStatusColor()` com normalização de strings
- ✅ Suporte para status antigos e novos (compatibilidade retroativa)

### 3. `migrar-status-ocs.html` (NOVO)
**Script de migração criado para:**
- 📊 Analisar dados existentes
- 🔄 Migrar status antigos para novos valores
- 💾 Criar backup automático antes da migração
- ↩️ Restaurar backup se necessário

## 🚀 Como Usar o Script de Migração

### Passo 1: Abrir o Script
1. Abra o arquivo `migrar-status-ocs.html` no navegador
2. O script irá automaticamente analisar os dados

### Passo 2: Analisar (Opcional)
- Clique em **"📊 Analisar Dados"** para ver quais OCs precisam de migração

### Passo 3: Migrar
1. Clique em **"🚀 Migrar Status"**
2. O script irá:
   - Criar backup automático
   - Migrar todos os status antigos
   - Mostrar relatório detalhado

### Passo 4: Verificar
- Recarregue a aplicação principal
- Verifique se os status estão corretos

### (Opcional) Restaurar Backup
- Se houver algum problema, clique em **"↩️ Restaurar Backup"**

## 🎨 Cores dos Status

| Status | Valor Interno | Cor | Código Tailwind |
|--------|---------------|-----|-----------------|
| Em aberto | `em_aberto` | 🟡 Amarelo | `bg-yellow-100 text-yellow-800` |
| Aprovado | `aprovado` | 🟢 Verde | `bg-green-100 text-green-800` |
| Encomendado | `encomendado` | 🔵 Azul | `bg-blue-100 text-blue-800` |
| Em depósito | `em_deposito` | 🟣 Roxo | `bg-purple-100 text-purple-800` |
| Aguardando outra OC | `aguardando_outra_oc` | 🟠 Laranja | `bg-orange-100 text-orange-800` |
| Agendado | `agendado` | 🔵 Índigo | `bg-indigo-100 text-indigo-800` |
| Entregue Parcial | `entregue_parcial` | 🔵 Ciano | `bg-cyan-100 text-cyan-800` |
| Entregue | `entregue` | 🟢 Verde | `bg-green-100 text-green-800` |
| Não entregue | `nao_entregue` | 🔴 Vermelho | `bg-red-100 text-red-800` |
| Cancelado | `cancelado` | 🔴 Vermelho | `bg-red-100 text-red-800` |
| Outro | `outro` | ⚪ Cinza | `bg-gray-100 text-gray-800` |

## ✅ Benefícios

1. **Consistência Visual**: Todos os status compartilhados têm as mesmas cores
2. **Filtros Funcionais**: Não haverá mais problemas com "ABERTO" vs "Em aberto"
3. **Manutenção Facilitada**: Código mais limpo e organizado
4. **Compatibilidade**: Sistema suporta status antigos e novos
5. **Migração Segura**: Script com backup automático

## ⚠️ Observações Importantes

1. **Backup**: Sempre é criado um backup automático antes da migração
2. **Compatibilidade**: O código suporta tanto os valores antigos quanto os novos
3. **Normalização**: Strings de status são normalizadas para comparação (ex: "Em aberto" → "em_aberto")
4. **Status de Assistência**: Será tratado posteriormente conforme solicitado

## 📝 Próximos Passos

1. ✅ Executar o script de migração `migrar-status-ocs.html`
2. ✅ Verificar se todos os status foram migrados corretamente
3. ✅ Testar filtros na lista de OCs
4. ⏳ Definir e implementar status de OCs de Assistência (futuro)

---

**Data da Padronização**: 10/10/2025  
**Versão**: 1.0



