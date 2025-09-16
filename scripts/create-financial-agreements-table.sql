-- Criando tabela de acordos financeiros que estava faltando
CREATE TABLE IF NOT EXISTS financial_agreements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  process_number VARCHAR(255),
  agreement_type VARCHAR(100) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  entry_value DECIMAL(15,2) DEFAULT 0,
  entry_date DATE,
  installments INTEGER DEFAULT 0,
  installment_value DECIMAL(15,2) DEFAULT 0,
  first_due_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  paid_installments INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_financial_agreements_client_id ON financial_agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_agreements_status ON financial_agreements(status);
CREATE INDEX IF NOT EXISTS idx_financial_agreements_created_at ON financial_agreements(created_at);

-- Habilitar RLS
ALTER TABLE financial_agreements ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Enable all operations for authenticated users" ON financial_agreements
  FOR ALL USING (true);
