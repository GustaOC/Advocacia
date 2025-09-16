-- scripts/update-clients-schema.sql
-- Atualização da estrutura da tabela clients para suportar os campos necessários

-- Primeiro, vamos verificar se a tabela existe
DO $$
BEGIN
    -- Se a tabela não existir, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        CREATE TABLE public.clients (
            id SERIAL PRIMARY KEY,
            "EXECUTADO(A)" VARCHAR(255),
            CPF VARCHAR(20),
            TELEFONE VARCHAR(20),
            ENDERECO VARCHAR(255),
            NUMERO VARCHAR(50),
            BAIRRO VARCHAR(100),
            CIDADE VARCHAR(100),
            PROCESSO VARCHAR(100),
            LOJA VARCHAR(100),
            email VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            "Data" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adiciona coluna EXECUTADO(A) se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'EXECUTADO(A)') THEN
        ALTER TABLE public.clients ADD COLUMN "EXECUTADO(A)" VARCHAR(255);
    END IF;

    -- Adiciona coluna CPF se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'CPF') THEN
        ALTER TABLE public.clients ADD COLUMN "CPF" VARCHAR(20);
    END IF;

    -- Adiciona coluna TELEFONE se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'TELEFONE') THEN
        ALTER TABLE public.clients ADD COLUMN "TELEFONE" VARCHAR(20);
    END IF;

    -- Adiciona coluna ENDERECO se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'ENDERECO') THEN
        ALTER TABLE public.clients ADD COLUMN "ENDERECO" VARCHAR(255);
    END IF;

    -- Adiciona coluna NUMERO se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'NUMERO') THEN
        ALTER TABLE public.clients ADD COLUMN "NUMERO" VARCHAR(50);
    END IF;

    -- Adiciona coluna BAIRRO se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'BAIRRO') THEN
        ALTER TABLE public.clients ADD COLUMN "BAIRRO" VARCHAR(100);
    END IF;

    -- Adiciona coluna CIDADE se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'CIDADE') THEN
        ALTER TABLE public.clients ADD COLUMN "CIDADE" VARCHAR(100);
    END IF;

    -- Adiciona coluna PROCESSO se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'PROCESSO') THEN
        ALTER TABLE public.clients ADD COLUMN "PROCESSO" VARCHAR(100);
    END IF;

    -- Adiciona coluna LOJA se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'LOJA') THEN
        ALTER TABLE public.clients ADD COLUMN "LOJA" VARCHAR(100);
    END IF;

    -- Adiciona coluna Data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'Data') THEN
        ALTER TABLE public.clients ADD COLUMN "Data" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adiciona coluna email se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE public.clients ADD COLUMN "email" VARCHAR(255);
    END IF;

    -- Adiciona coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE public.clients ADD COLUMN "status" VARCHAR(50) DEFAULT 'active';
    END IF;

    -- Adiciona coluna created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'created_at') THEN
        ALTER TABLE public.clients ADD COLUMN "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adiciona coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
        ALTER TABLE public.clients ADD COLUMN "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Migração de dados de colunas antigas (se existirem)
DO $$
BEGIN
    -- Se existe coluna 'name', migrar para EXECUTADO(A)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clients' AND column_name = 'name') THEN
        UPDATE public.clients 
        SET "EXECUTADO(A)" = name 
        WHERE "EXECUTADO(A)" IS NULL AND name IS NOT NULL;
    END IF;

    -- Se existe coluna 'phone', migrar para TELEFONE
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clients' AND column_name = 'phone') THEN
        UPDATE public.clients 
        SET "TELEFONE" = phone 
        WHERE "TELEFONE" IS NULL AND phone IS NOT NULL;
    END IF;

    -- Se existe coluna 'address', migrar para ENDERECO
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clients' AND column_name = 'address') THEN
        UPDATE public.clients 
        SET "ENDERECO" = address 
        WHERE "ENDERECO" IS NULL AND address IS NOT NULL;
    END IF;

    -- Se existe coluna 'cpf_cnpj', migrar para CPF
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clients' AND column_name = 'cpf_cnpj') THEN
        UPDATE public.clients 
        SET "CPF" = cpf_cnpj 
        WHERE "CPF" IS NULL AND cpf_cnpj IS NOT NULL;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_executado ON public.clients("EXECUTADO(A)");
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON public.clients("CPF");
CREATE INDEX IF NOT EXISTS idx_clients_telefone ON public.clients("TELEFONE");
CREATE INDEX IF NOT EXISTS idx_clients_processo ON public.clients("PROCESSO");
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients("status");
CREATE INDEX IF NOT EXISTS idx_clients_data ON public.clients("Data");
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients("email");

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Aplicar trigger na tabela
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE public.clients
    ADD CONSTRAINT chk_cpf_length 
      CHECK (CPF IS NULL OR CPF ~ '^[0-9]{11}$' OR CPF ~ '^[0-9]{14}$'),
    ADD CONSTRAINT chk_telefone_length 
      CHECK (TELEFONE IS NULL OR TELEFONE ~ '^[0-9]{10,11}$');


-- Criar política para permitir todas as operações (ajustar conforme necessário)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.clients;
CREATE POLICY "Enable all operations for authenticated users" 
    ON public.clients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verificação final da estrutura
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'clients'
ORDER BY ordinal_position;

-- Mensagem de conclusão
DO $
BEGIN
    RAISE NOTICE '=== ATUALIZAÇÃO DA TABELA CLIENTS CONCLUÍDA ===';
    RAISE NOTICE 'Estrutura atualizada com sucesso';
    RAISE NOTICE 'Total de registros: %', (SELECT COUNT(*) FROM public.clients);
END $
