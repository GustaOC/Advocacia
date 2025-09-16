-- Corrigir schema da tabela clients para corresponder aos nomes corretos do banco
-- Os nomes das colunas devem estar em português e maiúsculas conforme o banco existente

-- Primeiro, vamos verificar se precisamos renomear as colunas
-- Se as colunas já existem com os nomes corretos, este script não fará nada

-- Renomear colunas para os nomes corretos em português
DO $$
BEGIN
    -- Renomear name para EXECUTADO(A) se necessário
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
        ALTER TABLE public.clients RENAME COLUMN name TO "EXECUTADO(A)";
    END IF;
    
    -- Renomear phone para TELEFONE se necessário
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
        ALTER TABLE public.clients RENAME COLUMN phone TO "TELEFONE";
    END IF;
    
    -- Renomear address para ENDEREÇO se necessário
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') THEN
        ALTER TABLE public.clients RENAME COLUMN address TO "ENDEREÇO";
    END IF;
    
    -- Renomear cpf_cnpj para CPF se necessário
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'cpf_cnpj') THEN
        ALTER TABLE public.clients RENAME COLUMN cpf_cnpj TO "CPF";
    END IF;
    
    -- Adicionar colunas que estão faltando
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'NÚMERO') THEN
        ALTER TABLE public.clients ADD COLUMN "NÚMERO" NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'BAIRRO') THEN
        ALTER TABLE public.clients ADD COLUMN "BAIRRO" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'CIDADE') THEN
        ALTER TABLE public.clients ADD COLUMN "CIDADE" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'LOJA') THEN
        ALTER TABLE public.clients ADD COLUMN "LOJA" TEXT;
    END IF;
    
    -- Adicionar coluna Data se não existir (renomeando created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'Data') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_at') THEN
            ALTER TABLE public.clients RENAME COLUMN created_at TO "Data";
        ELSE
            ALTER TABLE public.clients ADD COLUMN "Data" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Verificar a estrutura final da tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

SELECT 'Schema das colunas corrigido com sucesso' as status;
