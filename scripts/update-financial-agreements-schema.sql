-- scripts/update-financial-agreements-schema.sql
-- 🗃️ MELHORIAS NA TABELA DE ACORDOS FINANCEIROS

-- 📊 Adicionar colunas para controle de IPCA e renegociação
ALTER TABLE financial_agreements 
ADD COLUMN IF NOT EXISTS apply_ipca BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ipca_base_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS renegotiation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_renegotiation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_total_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS original_installments INTEGER;

-- 📝 Criar tabela de histórico de acordos (se não existir)
CREATE TABLE IF NOT EXISTS agreement_history (
  id SERIAL PRIMARY KEY,
  agreement_id INTEGER REFERENCES financial_agreements(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- created, updated, renegotiated, deleted, payment_received
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id INTEGER, -- ID do usuário que fez a alteração
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Criar tabela para armazenar dados do IPCA (cache local)
CREATE TABLE IF NOT EXISTS ipca_rates (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  rate DECIMAL(8,4) NOT NULL, -- Taxa mensal em %
  accumulated_rate DECIMAL(10,4), -- Taxa acumulada no ano
  source VARCHAR(100) DEFAULT 'BCB', -- Fonte dos dados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- 💰 Criar tabela para controle de parcelas individuais
CREATE TABLE IF NOT EXISTS agreement_installments (
  id SERIAL PRIMARY KEY,
  agreement_id INTEGER REFERENCES financial_agreements(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  original_value DECIMAL(15,2) NOT NULL,
  corrected_value DECIMAL(15,2), -- Valor corrigido pelo IPCA
  due_date DATE NOT NULL,
  paid_date TIMESTAMP,
  paid_value DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  days_overdue INTEGER DEFAULT 0,
  interest_amount DECIMAL(15,2) DEFAULT 0.00, -- Juros por atraso
  correction_amount DECIMAL(15,2) DEFAULT 0.00, -- Correção monetária
  last_correction_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agreement_id, installment_number)
);

-- 📈 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_agreements_client_status ON financial_agreements(client_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_agreements_created_at ON financial_agreements(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_agreements_ipca_base ON financial_agreements(ipca_base_date) WHERE apply_ipca = true;
CREATE INDEX IF NOT EXISTS idx_agreement_history_agreement ON agreement_history(agreement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_installments_agreement_status ON agreement_installments(agreement_id, status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON agreement_installments(due_date, status);
CREATE INDEX IF NOT EXISTS idx_ipca_rates_year_month ON ipca_rates(year, month);

-- 🔧 Criar função para atualizar valores corrigidos pelo IPCA
CREATE OR REPLACE FUNCTION update_ipca_corrected_values()
RETURNS void AS $$
DECLARE
    agreement_record RECORD;
    installment_record RECORD;
    ipca_correction DECIMAL(10,4);
    base_date DATE;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Atualizar acordos com IPCA ativo
    FOR agreement_record IN 
        SELECT id, total_value, ipca_base_date 
        FROM financial_agreements 
        WHERE apply_ipca = true AND status IN ('active', 'suspended')
    LOOP
        base_date := agreement_record.ipca_base_date::DATE;
        
        -- Calcular correção IPCA (simplificado - na prática usar a API)
        SELECT COALESCE(SUM(rate), 0) INTO ipca_correction
        FROM ipca_rates 
        WHERE (year * 12 + month) > (EXTRACT(YEAR FROM base_date) * 12 + EXTRACT(MONTH FROM base_date))
        AND (year * 12 + month) <= (EXTRACT(YEAR FROM current_date) * 12 + EXTRACT(MONTH FROM current_date));
        
        -- Atualizar parcelas individuais
        FOR installment_record IN 
            SELECT id, original_value 
            FROM agreement_installments 
            WHERE agreement_id = agreement_record.id AND status = 'pending'
        LOOP
            UPDATE agreement_installments 
            SET 
                corrected_value = original_value * (1 + ipca_correction / 100),
                correction_amount = original_value * (ipca_correction / 100),
                last_correction_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = installment_record.id;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Valores corrigidos pelo IPCA atualizados com sucesso';
END;
$$ LANGUAGE plpgsql;

-- 🔧 Criar função para calcular parcelas em atraso
CREATE OR REPLACE FUNCTION update_overdue_installments()
RETURNS void AS $$
DECLARE
    installment_record RECORD;
    days_overdue INTEGER;
    daily_interest_rate DECIMAL(10,6) := 0.0003; -- 0.03% ao dia (aproximadamente 1% ao mês)
BEGIN
    FOR installment_record IN 
        SELECT id, agreement_id, due_date, original_value, corrected_value
        FROM agreement_installments 
        WHERE status = 'pending' AND due_date < CURRENT_DATE
    LOOP
        days_overdue := CURRENT_DATE - installment_record.due_date;
        
        UPDATE agreement_installments 
        SET 
            status = 'overdue',
            days_overdue = days_overdue,
            interest_amount = COALESCE(corrected_value, original_value) * daily_interest_rate * days_overdue,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = installment_record.id;
    END LOOP;
    
    RAISE NOTICE 'Parcelas em atraso atualizadas com sucesso';
END;
$$ LANGUAGE plpgsql;

-- 🔧 Criar função para processar renegociação
CREATE OR REPLACE FUNCTION process_agreement_renegotiation(
    agreement_id_param INTEGER,
    new_total_value DECIMAL(15,2),
    new_installments INTEGER,
    new_first_due_date DATE,
    new_entry_value DECIMAL(15,2) DEFAULT 0,
    reset_ipca_base BOOLEAN DEFAULT true,
    reason TEXT DEFAULT 'Renegociação solicitada pelo cliente'
) RETURNS JSON AS $$
DECLARE
    old_agreement RECORD;
    new_installment_value DECIMAL(15,2);
    remaining_value DECIMAL(15,2);
    result JSON;
BEGIN
    -- Buscar acordo existente
    SELECT * INTO old_agreement FROM financial_agreements WHERE id = agreement_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Acordo não encontrado');
    END IF;
    
    -- Calcular novos valores
    remaining_value := new_total_value - new_entry_value;
    new_installment_value := remaining_value / new_installments;
    
    -- Cancelar parcelas pendentes antigas
    UPDATE agreement_installments 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE agreement_id = agreement_id_param AND status IN ('pending', 'overdue');
    
    -- Atualizar o acordo
    UPDATE financial_agreements 
    SET 
        total_value = new_total_value,
        entry_value = new_entry_value,
        installments = new_installments,
        installment_value = new_installment_value,
        remaining_value = remaining_value,
        first_due_date = new_first_due_date,
        agreement_type = 'renegociacao',
        status = 'active',
        paid_installments = 0,
        renegotiation_count = COALESCE(renegotiation_count, 0) + 1,
        last_renegotiation_date = CURRENT_TIMESTAMP,
        ipca_base_date = CASE WHEN reset_ipca_base THEN CURRENT_TIMESTAMP ELSE ipca_base_date END,
        original_total_value = COALESCE(original_total_value, old_agreement.total_value),
        original_installments = COALESCE(original_installments, old_agreement.installments),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = agreement_id_param;
    
    -- Criar novas parcelas
    FOR i IN 1..new_installments LOOP
        INSERT INTO agreement_installments (
            agreement_id, 
            installment_number, 
            original_value, 
            due_date,
            created_at
        ) VALUES (
            agreement_id_param,
            i,
            new_installment_value,
            new_first_due_date + ((i-1) * INTERVAL '1 month'),
            CURRENT_TIMESTAMP
        );
    END LOOP;
    
    -- Registrar no histórico
    INSERT INTO agreement_history (
        agreement_id,
        action,
        description,
        old_values,
        new_values,
        created_at
    ) VALUES (
        agreement_id_param,
        'renegotiated',
        reason,
        row_to_json(old_agreement),
        json_build_object(
            'total_value', new_total_value,
            'installments', new_installments,
            'first_due_date', new_first_due_date,
            'entry_value', new_entry_value
        ),
        CURRENT_TIMESTAMP
    );
    
    result := json_build_object(
        'success', true,
        'message', 'Renegociação processada com sucesso',
        'old_total_value', old_agreement.total_value,
        'new_total_value', new_total_value,
        'old_installments', old_agreement.installments,
        'new_installments', new_installments,
        'installment_value', new_installment_value
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 📊 Criar view para relatórios financeiros
CREATE OR REPLACE VIEW financial_agreements_summary AS
SELECT 
    fa.id,
    fa.client_id,
    c.name as client_name,
    fa.total_value as original_total_value,
    fa.entry_value,
    fa.installments,
    fa.paid_installments,
    fa.status,
    fa.agreement_type,
    fa.created_at,
    fa.apply_ipca,
    fa.ipca_base_date,
    fa.renegotiation_count,
    
    -- Cálculos baseados nas parcelas
    COALESCE(SUM(ai.original_value), 0) as total_installments_value,
    COALESCE(SUM(ai.corrected_value), SUM(ai.original_value)) as corrected_installments_value,
    COALESCE(SUM(CASE WHEN ai.status = 'paid' THEN ai.paid_value ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN ai.status = 'overdue' THEN ai.interest_amount ELSE 0 END), 0) as total_interest,
    COUNT(CASE WHEN ai.status = 'overdue' THEN 1 END) as overdue_installments_count,
    
    -- Status calculados
    CASE 
        WHEN fa.paid_installments = fa.installments THEN 'completed'
        WHEN COUNT(CASE WHEN ai.status = 'overdue' THEN 1 END) > 0 THEN 'with_overdue'
        ELSE fa.status
    END as calculated_status

FROM financial_agreements fa
LEFT JOIN clients c ON fa.client_id = c.id
LEFT JOIN agreement_installments ai ON fa.id = ai.agreement_id
GROUP BY 
    fa.id, fa.client_id, c.name, fa.total_value, fa.entry_value, 
    fa.installments, fa.paid_installments, fa.status, fa.agreement_type,
    fa.created_at, fa.apply_ipca, fa.ipca_base_date, fa.renegotiation_count;

-- 🔄 Criar job automático para atualização diária (usando pg_cron se disponível)
-- Nota: Esta parte requer a extensão pg_cron instalada
-- SELECT cron.schedule('update-ipca-daily', '0 6 * * *', 'SELECT update_ipca_corrected_values(); SELECT update_overdue_installments();');

-- 📝 Comentários e documentação
COMMENT ON TABLE financial_agreements IS 'Tabela principal de acordos financeiros com suporte a IPCA e renegociação';
COMMENT ON TABLE agreement_history IS 'Histórico completo de alterações nos acordos financeiros';
COMMENT ON TABLE agreement_installments IS 'Controle individual de cada parcela do acordo';
COMMENT ON TABLE ipca_rates IS 'Cache local das taxas IPCA do Banco Central';
COMMENT ON VIEW financial_agreements_summary IS 'View consolidada para relatórios financeiros';

COMMENT ON COLUMN financial_agreements.apply_ipca IS 'Se deve aplicar correção monetária pelo IPCA';
COMMENT ON COLUMN financial_agreements.ipca_base_date IS 'Data base para cálculo da correção IPCA';
COMMENT ON COLUMN financial_agreements.renegotiation_count IS 'Número de renegociações do acordo';
COMMENT ON COLUMN agreement_installments.corrected_value IS 'Valor da parcela corrigido pelo IPCA';
COMMENT ON COLUMN agreement_installments.interest_amount IS 'Juros por atraso no pagamento';

-- 🎯 Inserir dados de exemplo do IPCA (últimos 12 meses)
-- Estes são dados aproximados - na prática virão da API do Banco Central
INSERT INTO ipca_rates (month, year, rate, created_at) VALUES 
(1, 2024, 0.42, CURRENT_TIMESTAMP),
(2, 2024, 0.83, CURRENT_TIMESTAMP),
(3, 2024, 0.16, CURRENT_TIMESTAMP),
(4, 2024, 0.38, CURRENT_TIMESTAMP),
(5, 2024, 0.46, CURRENT_TIMESTAMP),
(6, 2024, 0.21, CURRENT_TIMESTAMP),
(7, 2024, 0.38, CURRENT_TIMESTAMP),
(8, 2024, -0.02, CURRENT_TIMESTAMP),
(9, 2024, 0.44, CURRENT_TIMESTAMP),
(10, 2024, 0.56, CURRENT_TIMESTAMP),
(11, 2024, 0.39, CURRENT_TIMESTAMP),
(12, 2024, 0.52, CURRENT_TIMESTAMP)
ON CONFLICT (month, year) DO UPDATE SET 
    rate = EXCLUDED.rate,
    updated_at = CURRENT_TIMESTAMP;

-- ✅ Verificar integridade dos dados existentes
DO $
DECLARE
    agreement_count INTEGER;
    missing_installments INTEGER;
BEGIN
    SELECT COUNT(*) INTO agreement_count FROM financial_agreements;
    
    -- Criar parcelas para acordos existentes que não têm
    FOR agreement_record IN 
        SELECT fa.id, fa.installments, fa.installment_value, fa.first_due_date
        FROM financial_agreements fa
        LEFT JOIN agreement_installments ai ON fa.id = ai.agreement_id
        WHERE ai.id IS NULL AND fa.status != 'cancelled'
    LOOP
        FOR i IN 1..agreement_record.installments LOOP
            INSERT INTO agreement_installments (
                agreement_id, 
                installment_number, 
                original_value, 
                due_date,
                created_at
            ) VALUES (
                agreement_record.id,
                i,
                agreement_record.installment_value,
                agreement_record.first_due_date + ((i-1) * INTERVAL '1 month'),
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
    
    SELECT COUNT(*) INTO missing_installments 
    FROM financial_agreements fa
    LEFT JOIN agreement_installments ai ON fa.id = ai.agreement_id
    WHERE ai.id IS NULL;
    
    RAISE NOTICE 'Verificação concluída: % acordos encontrados, % parcelas criadas', 
                 agreement_count, missing_installments;
END $;
