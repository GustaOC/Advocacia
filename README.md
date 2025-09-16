# Sistema Jurídico - Gestão de Clientes e Processos

## 🚀 Configuração Inicial

### 1. Configurar Supabase

1. Crie uma conta em [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá para **Settings** → **API** e copie:
   - `Project URL` 
   - `anon public` key

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=[sua_project_url_aqui](https://enroqbjkbhosuelsmmae.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucm9xYmprYmhvc3VlbHNtbWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTY2OTUsImV4cCI6MjA3MDc3MjY5NX0.wb-V-lhkpZPjYgMU4O2TDivuSp4fn5J-axXgPyIGwrw
\`\`\`

### 3. Criar Tabelas no Banco

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `scripts/create-tables.sql`
6. Cole no editor e clique em **Run**
7. Aguarde a execução completar

### 4. Executar o Projeto

\`\`\`bash
npm install
npm run dev
\`\`\`

Acesse `http://localhost:3000/dashboard` para começar a usar o sistema.

## ✅ Verificação

Se tudo estiver configurado corretamente, você verá:
- ✅ Conexão com banco de dados estabelecida
- ✅ 4 clientes de exemplo carregados
- ✅ 4 processos de exemplo carregados

## 🔧 Solução de Problemas

### Erro: "Could not find the table 'public.clients'"

1. Verifique se executou o script SQL completo
2. Confirme que as variáveis de ambiente estão corretas
3. Verifique se o projeto Supabase está ativo

### Erro de Conexão

1. Verifique a URL do projeto Supabase
2. Confirme que a chave anon está correta
3. Verifique sua conexão com a internet

## 📋 Funcionalidades

- ✅ Gestão completa de clientes
- ✅ Importação em massa via CSV/Excel
- ✅ Integração automática cliente-processo
- ✅ Controle de processos jurídicos
- ✅ Timeline de eventos
- ✅ Backup e migração de dados
- ✅ Interface responsiva
- ✅ Validação de dados
- ✅ Sincronização em tempo real

---

## Sistema de Gestão Jurídica

Este sistema foi desenvolvido para escritórios de advocacia gerenciarem clientes e processos de forma integrada e eficiente.


## 🚀 Melhorias aplicadas nesta versão
- Supabase SSR unificado com suporte correto a Set-Cookie.
- `createAdminClient()` seguro (service role só no server).
- `lib/auth.ts` com `getSessionUser`, `requireAuth` e `requirePermission` (RBAC simples).
- Middleware endurecido cobrindo caminhos privados e assets estáticos.
- Rotas `/api/auth/*` padronizadas (login/logout/me/set-password).
- CRUD de clientes com **Zod** (validação + mensagens claras).
- `.env.example` incluído.
- Cabeçalhos de segurança no `next.config.mjs`.
- Scripts DX: `typecheck` e `lint`.
