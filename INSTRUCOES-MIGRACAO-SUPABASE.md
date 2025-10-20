# 📋 INSTRUÇÕES DE MIGRAÇÃO DO BANCO DE DADOS SUPABASE

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

Este documento contém as instruções detalhadas para executar o script SQL completo que corrigirá e integrará todas as funcionalidades do sistema de advocacia com o Supabase.

**O QUE ESTE SCRIPT FAZ:**
- ✅ Cria TODAS as tabelas necessárias para o sistema
- ✅ Configura relacionamentos entre tabelas (Foreign Keys)
- ✅ Cria índices para melhorar a performance
- ✅ Configura Row Level Security (RLS) para segurança
- ✅ Adiciona triggers automáticos (ex: atualizar `updated_at`)
- ✅ Cria funções úteis (ex: verificar parcelas atrasadas)
- ✅ Insere dados iniciais (permissões, funções, regras de notificação)
- ✅ Cria views para relatórios

**O QUE ESTE SCRIPT NÃO AFETA:**
- ❌ Sistema de autenticação (tabela `auth.users`)
- ❌ Usuários existentes
- ❌ Sessões ativas

---

## 🎯 ANÁLISE REALIZADA

### Problemas Identificados

Durante a análise profunda do código, identifiquei os seguintes problemas:

1. **Entidades (Clientes/Executados):**
   - ✓ Campo `neighborhood` no banco vs `district` no código (já tratado no código)
   - ✓ Falta campo `birth_date` no banco (será criado)
   - ✓ Falta campos de filiação (`mother_name`, `father_name`)

2. **Processos (Cases):**
   - ✓ Relacionamento com entidades via `case_parties` (será criado corretamente)
   - ✓ Histórico de status (`case_status_history`) (será criado)
   - ✓ Campos de alvará (`has_alvara`, `alvara_value`) (serão criados)

3. **Sistema Financeiro:**
   - ✓ Acordos financeiros (`financial_agreements`) com todos os campos
   - ✓ Parcelas (`financial_installments`) com campos corretos
   - ✓ Pagamentos (`financial_payments`) sem campo `created_by` (conforme código)
   - ✓ Constraint FK com nome específico para debtor (usado no código)

4. **Outros Módulos:**
   - ✓ Documentos, petições, templates
   - ✓ Sistema de notificações
   - ✓ Sistema de auditoria
   - ✓ Permissões e funções

---

## 📝 PASSO A PASSO PARA EXECUTAR

### Opção 1: Executar Script Completo (RECOMENDADO para novos bancos)

Se você está começando do zero ou quer recriar tudo:

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com
   - Faça login no seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**

3. **Crie uma Nova Query:**
   - Clique em **"New query"**

4. **Copie o Script:**
   - Abra o arquivo `supabase-complete-schema.sql`
   - Copie TODO o conteúdo do arquivo

5. **Cole no Editor:**
   - Cole o conteúdo no editor SQL do Supabase

6. **Execute o Script:**
   - Clique no botão **"RUN"** (ou pressione Ctrl+Enter)

7. **Aguarde a Execução:**
   - O script pode levar alguns segundos para executar
   - Você verá mensagens de progresso no painel

8. **Verifique os Resultados:**
   - No final, você verá uma mensagem: "✅ SCRIPT EXECUTADO COM SUCESSO!"
   - Verifique se não há erros na saída

---

### Opção 2: Executar Incrementalmente (Para bancos existentes com dados)

Se você já tem dados e quer preservá-los:

**⚠️ ATENÇÃO:** Faça backup primeiro!

1. **Faça Backup dos Dados:**
   ```sql
   -- Execute no SQL Editor para ver seus dados atuais
   SELECT * FROM entities;
   SELECT * FROM cases;
   SELECT * FROM financial_agreements;
   SELECT * FROM financial_installments;
   SELECT * FROM financial_payments;
   ```

2. **Descomente a Seção de Limpeza (se quiser recriar):**
   - Abra o arquivo `supabase-complete-schema.sql`
   - Vá até a seção "PARTE 1: LIMPEZA"
   - Descomente as linhas `DROP TABLE...` **APENAS SE QUISER APAGAR TUDO**

3. **Execute o Script:**
   - Siga os passos da Opção 1

4. **Restaure os Dados (se necessário):**
   - Após criar as tabelas, use comandos INSERT para restaurar os dados

---

## 🔍 VERIFICAÇÕES PÓS-EXECUÇÃO

### 1. Verificar se todas as tabelas foram criadas

Execute no SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tabelas esperadas:**
- ✓ entities
- ✓ cases
- ✓ case_parties
- ✓ case_status_history
- ✓ financial_agreements
- ✓ financial_installments
- ✓ financial_payments
- ✓ documents
- ✓ document_templates
- ✓ petitions
- ✓ notifications
- ✓ notification_rules
- ✓ audit_logs
- ✓ user_profiles
- ✓ roles
- ✓ permissions
- ✓ role_permissions

### 2. Verificar dados iniciais (seed)

```sql
-- Verificar permissões
SELECT COUNT(*) as total_permissions FROM permissions;
-- Deve retornar pelo menos 17 permissões

-- Verificar funções/cargos
SELECT name FROM roles ORDER BY name;
-- Deve mostrar: Administrador, Advogado, Assistente, Financeiro

-- Verificar regras de notificação
SELECT name, days_before_due FROM notification_rules;
-- Deve mostrar 3 regras (7, 3 e 1 dia antes)
```

### 3. Testar a aplicação

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor atual (Ctrl+C)
   # Inicie novamente:
   pnpm run dev
   ```

2. **Acesse a aplicação:**
   - Abra: http://localhost:3000
   - Faça login (a área de login NÃO foi afetada)

3. **Teste cada módulo:**
   - ✓ Cadastro de Clientes/Entidades
   - ✓ Cadastro de Processos
   - ✓ Criação de Acordos Financeiros
   - ✓ Registro de Parcelas
   - ✓ Registro de Pagamentos

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "relation already exists"

**Causa:** A tabela já existe no banco
**Solução:**
- Se quiser recriar, descomente a seção de limpeza (PARTE 1)
- Se quiser manter, o script vai pular a criação (devido ao `IF NOT EXISTS`)

### Erro: "permission denied"

**Causa:** Usuário sem permissões suficientes
**Solução:**
- Certifique-se de estar usando o SQL Editor do Supabase (ele usa service_role)
- Se estiver usando outro client, use as credenciais de service_role do projeto

### Erro: "foreign key violation"

**Causa:** Tentando deletar dados que têm relacionamentos
**Solução:**
- Verifique as tabelas relacionadas
- Use `CASCADE` nas deleções ou delete na ordem correta

### Erro de encoding/caracteres

**Causa:** Problema com acentuação ou caracteres especiais
**Solução:**
- O script está em UTF-8
- Certifique-se de que o editor mantém a codificação UTF-8

---

## 📊 ESTRUTURA DO BANCO CRIADO

### Diagrama de Relacionamentos (Simplificado)

```
┌─────────────┐
│   entities  │─┐
└─────────────┘ │
                │
                ├──> case_parties <──┐
                │                    │
                │    ┌─────────────┐ │
                └──> │    cases    │<┘
                     └─────────────┘
                            │
                            │
                     ┌──────┴───────┐
                     │              │
            ┌────────▼────────┐ ┌──▼──────────────────┐
            │    documents    │ │ financial_agreements│
            └─────────────────┘ └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │financial_installments│
                                └──────────┬──────────┘
                                           │
                                ┌──────────▼──────────┐
                                │ financial_payments  │
                                └─────────────────────┘
```

### Tipos de Dados Principais

**Entity Types:** Cliente, Executado, Advogado, Testemunha, Outro

**Case Status:** Em Andamento, Finalizado, Arquivado, Suspenso, Acordo, Pago, Extinto

**Case Priority:** Alta, Média, Baixa

**Agreement Status:** ATIVO, INADIMPLENTE, PAUSADO, CONCLUIDO, CANCELADO

**Installment Status:** PENDENTE, PAGA, ATRASADA, RENEGOCIADA, CANCELADA

**Payment Method:** BOLETO, CARTAO_CREDITO, DEBITO, PIX, TRANSFERENCIA, DINHEIRO

**Agreement Type:** ENTRADA_PARCELADO, SOMENTE_PARCELADO, A_VISTA

---

## 🔐 SEGURANÇA (RLS)

O script configura Row Level Security (RLS) em todas as tabelas:

- ✅ **Service Role:** Acesso completo (usado pelas APIs)
- ✅ **Usuários Autenticados:** Acesso controlado por políticas
- ✅ **Notificações:** Usuários veem apenas suas próprias
- ✅ **Perfis:** Usuários atualizam apenas o próprio perfil

---

## 🚀 FUNCIONALIDADES AUTOMÁTICAS

### Triggers Configurados

1. **Atualização de `updated_at`:**
   - Automático em todas as tabelas ao fazer UPDATE

2. **Criação de Perfil de Usuário:**
   - Quando um novo usuário é criado em auth.users, automaticamente cria entrada em user_profiles

3. **Verificação de Acordo Completo:**
   - Quando todas as parcelas são pagas, marca acordo como CONCLUIDO

### Funções Disponíveis

1. **`update_overdue_installments()`**
   - Atualiza parcelas vencidas para status ATRASADA
   - Execute periodicamente (pode criar cron job)

2. **`get_installment_total_paid(installment_id)`**
   - Retorna total pago em uma parcela

3. **`generate_installment_notifications()`**
   - Gera notificações baseadas nas regras configuradas
   - Execute diariamente (pode criar cron job)

### Views Criadas

1. **`vw_case_financial_summary`**
   - Resumo financeiro por caso

2. **`vw_upcoming_installments`**
   - Parcelas a vencer nos próximos 30 dias

3. **`vw_system_statistics`**
   - Estatísticas gerais do sistema

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs no SQL Editor do Supabase
2. Verifique o console do navegador (F12) na aplicação
3. Verifique os logs do servidor de desenvolvimento
4. Compare a estrutura criada com o que o código espera

---

## ✅ CHECKLIST FINAL

Antes de considerar a migração completa:

- [ ] Script SQL executado sem erros
- [ ] Todas as tabelas criadas
- [ ] Dados seed inseridos (permissões, funções)
- [ ] Servidor de desenvolvimento reiniciado
- [ ] Login funcionando (área não afetada)
- [ ] Cadastro de clientes funcionando
- [ ] Cadastro de processos funcionando
- [ ] Sistema financeiro funcionando
- [ ] Parcelas por mês aparecendo corretamente
- [ ] Pagamentos sendo registrados
- [ ] Sem erros no console do navegador
- [ ] Sem erros no servidor de desenvolvimento

---

## 🎉 RESULTADO ESPERADO

Após executar este script e seguir todos os passos:

✅ Sistema totalmente integrado com Supabase
✅ Cadastros funcionando (clientes, processos, financeiro)
✅ Relacionamentos corretos entre tabelas
✅ Performance otimizada com índices
✅ Segurança configurada com RLS
✅ Automações via triggers
✅ Dados iniciais prontos
✅ Sistema pronto para produção

---

**Data de criação:** 09/10/2025
**Versão do script:** 1.0
**Compatível com:** Next.js 14, Supabase, PostgreSQL 15+
