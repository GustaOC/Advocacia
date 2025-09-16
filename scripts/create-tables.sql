-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.processes CASCADE;
DROP TABLE IF EXISTS public.publications CASCADE;

-- Drop existing sequences if they exist
DROP SEQUENCE IF EXISTS public.clients_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.processes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.publications_id_seq CASCADE;

-- Create clients table
CREATE TABLE public.clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    cpf_cnpj VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processes table
CREATE TABLE public.processes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES public.clients(id) ON DELETE CASCADE,
    process_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    court VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create publications table
CREATE TABLE public.publications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    publication_date DATE NOT NULL,
    source VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_cpf_cnpj ON public.clients(cpf_cnpj);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_processes_client_id ON public.processes(client_id);
CREATE INDEX idx_processes_status ON public.processes(status);
CREATE INDEX idx_processes_process_number ON public.processes(process_number);
CREATE INDEX idx_publications_date ON public.publications(publication_date);
CREATE INDEX idx_publications_category ON public.publications(category);
CREATE INDEX idx_publications_status ON public.publications(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON public.publications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications DISABLE ROW LEVEL SECURITY;

-- Insert sample data
INSERT INTO public.clients (name, email, phone, address, cpf_cnpj, status) VALUES
('João Silva', 'joao.silva@email.com', '(67) 99999-1111', 'Rua das Flores, 123, Campo Grande - MS', '123.456.789-00', 'active'),
('Maria Santos', 'maria.santos@email.com', '(67) 99999-2222', 'Av. Afonso Pena, 456, Campo Grande - MS', '987.654.321-00', 'active'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '(67) 99999-3333', 'Rua 14 de Julho, 789, Campo Grande - MS', '456.789.123-00', 'active'),
('Ana Costa', 'ana.costa@email.com', '(67) 99999-4444', 'Rua Barão do Rio Branco, 321, Campo Grande - MS', '789.123.456-00', 'active'),
('Carlos Ferreira', 'carlos.ferreira@email.com', '(67) 99999-5555', 'Av. Mato Grosso, 654, Campo Grande - MS', '321.654.987-00', 'active');

INSERT INTO public.processes (client_id, process_number, title, description, status, court, start_date) VALUES
(1, '1234567-89.2024.8.12.0001', 'Ação de Cobrança', 'Cobrança de valores em atraso', 'active', 'Tribunal de Justiça de MS', '2024-01-15'),
(2, '2345678-90.2024.8.12.0002', 'Divórcio Consensual', 'Processo de divórcio por mútuo consentimento', 'active', 'Tribunal de Justiça de MS', '2024-02-20'),
(3, '3456789-01.2024.8.12.0003', 'Ação Trabalhista', 'Reclamação trabalhista por verbas rescisórias', 'active', 'Tribunal Regional do Trabalho', '2024-03-10'),
(4, '4567890-12.2024.8.12.0004', 'Inventário', 'Processo de inventário e partilha', 'active', 'Tribunal de Justiça de MS', '2024-04-05'),
(5, '5678901-23.2024.8.12.0005', 'Ação de Despejo', 'Ação de despejo por falta de pagamento', 'active', 'Tribunal de Justiça de MS', '2024-05-12');

INSERT INTO public.publications (title, content, publication_date, source, category, status) VALUES
('Nova Lei de Proteção de Dados', 'Alterações importantes na LGPD que afetam empresas...', '2024-01-10', 'Diário Oficial', 'Direito Digital', 'active'),
('Mudanças no Código Civil', 'Atualizações no regime de bens no casamento...', '2024-02-15', 'Diário da Justiça', 'Direito Civil', 'active'),
('Reforma Trabalhista', 'Novas regras para contratos de trabalho...', '2024-03-20', 'Tribunal Superior do Trabalho', 'Direito Trabalhista', 'active'),
('Direitos do Consumidor', 'Novos direitos em compras online...', '2024-04-25', 'PROCON', 'Direito do Consumidor', 'active'),
('Previdência Social', 'Mudanças nas regras de aposentadoria...', '2024-05-30', 'INSS', 'Direito Previdenciário', 'active');

-- Verification queries
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE SETUP COMPLETED ===';
    RAISE NOTICE 'Tables created successfully:';
    RAISE NOTICE '- clients: % records', (SELECT COUNT(*) FROM public.clients);
    RAISE NOTICE '- processes: % records', (SELECT COUNT(*) FROM public.processes);
    RAISE NOTICE '- publications: % records', (SELECT COUNT(*) FROM public.publications);
    RAISE NOTICE '';
    RAISE NOTICE 'Clients table structure:';
END $$;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Test basic queries
SELECT 'Database connection test: SUCCESS' as status;
SELECT 'Sample client data:' as info, name, email FROM public.clients LIMIT 3;
