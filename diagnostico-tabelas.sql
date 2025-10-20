-- ============================================================================
-- DIAGNÓSTICO DA ESTRUTURA ATUAL DO BANCO
-- ============================================================================
-- Execute este script no Supabase SQL Editor para ver a estrutura real

-- 1. Ver todas as colunas da tabela permissions
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'permissions'
ORDER BY ordinal_position;

-- 2. Ver todas as colunas da tabela roles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- 3. Ver todas as colunas da tabela entities
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entities'
ORDER BY ordinal_position;

-- 4. Ver todas as colunas da tabela cases
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cases'
ORDER BY ordinal_position;

-- 5. Listar todas as tabelas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
