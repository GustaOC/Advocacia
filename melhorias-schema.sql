-- ============================================================================
-- MELHORIAS PARA O SCHEMA SUPABASE
-- ============================================================================
-- Execute este script APÓS o supabase-schema-minimal.sql
-- Adiciona índices adicionais, triggers, funções e views
-- ============================================================================

-- ============================================================================
-- 0. HABILITAR EXTENSÕES NECESSÁRIAS
-- ============================================================================

-- Extensão para busca de texto avançada (trigram - opcional)
-- Descomente se quiser habilitar busca fuzzy em nomes:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índices compostos e parciais para otimização
CREATE INDEX IF NOT EXISTS idx_financial_installments_due_date_status
ON public.financial_installments(due_date, status);

CREATE INDEX IF NOT EXISTS idx_financial_installments_status_pending
ON public.financial_installments(status)
WHERE status IN ('PENDENTE', 'ATRASADA');

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications(user_id, is_read)
WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_case_parties_role
ON public.case_parties(role);

CREATE INDEX IF NOT EXISTS idx_cases_status_priority
ON public.cases(status, priority);

CREATE INDEX IF NOT EXISTS idx_financial_payments_payment_date
ON public.financial_payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_agreements_creditor_id
ON public.financial_agreements(creditor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs(created_at DESC);

-- Índice para busca de texto em nomes (requer extensão pg_trgm)
-- Descomente após habilitar a extensão pg_trgm acima:
-- CREATE INDEX IF NOT EXISTS idx_entities_name_trgm
-- ON public.entities USING gin(name gin_trgm_ops);

-- Índice alternativo simples para busca de nomes (não requer extensão)
CREATE INDEX IF NOT EXISTS idx_entities_name_lower
ON public.entities(LOWER(name));

-- ============================================================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para obter total pago em uma parcela
-- NOTA: Ajuste o tipo do parâmetro conforme sua base de dados:
-- Se installment_id for INTEGER, mude UUID para INTEGER
-- Se installment_id for UUID, deixe como está
CREATE OR REPLACE FUNCTION get_installment_total_paid(p_installment_id UUID)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(amount_paid), 0)
    FROM public.financial_payments
    WHERE installment_id = p_installment_id;
$$ LANGUAGE SQL STABLE;

-- Versão alternativa caso installment_id seja INTEGER (descomente se necessário):
-- CREATE OR REPLACE FUNCTION get_installment_total_paid(p_installment_id INTEGER)
-- RETURNS NUMERIC AS $$
--     SELECT COALESCE(SUM(amount_paid), 0)
--     FROM public.financial_payments
--     WHERE installment_id = p_installment_id;
-- $$ LANGUAGE SQL STABLE;

-- Função para marcar parcelas atrasadas
CREATE OR REPLACE FUNCTION mark_overdue_installments()
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    WITH updated AS (
        UPDATE public.financial_installments
        SET status = 'ATRASADA'
        WHERE status = 'PENDENTE'
        AND due_date < CURRENT_DATE
        RETURNING id
    )
    SELECT COUNT(*)::INT INTO v_count FROM updated;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar conclusão de acordo
CREATE OR REPLACE FUNCTION check_agreement_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'PAGA' AND (OLD.status IS NULL OR OLD.status != 'PAGA') THEN
        UPDATE public.financial_agreements
        SET status = 'CONCLUIDO', updated_at = NOW()
        WHERE id = NEW.agreement_id
        AND NOT EXISTS (
            SELECT 1
            FROM public.financial_installments
            WHERE agreement_id = NEW.agreement_id
            AND status NOT IN ('PAGA', 'CANCELADA')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de um acordo
CREATE OR REPLACE FUNCTION get_agreement_stats(p_agreement_id UUID)
RETURNS TABLE(
    total_installments BIGINT,
    paid_installments BIGINT,
    pending_installments BIGINT,
    overdue_installments BIGINT,
    total_paid NUMERIC,
    total_pending NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_installments,
        COUNT(*) FILTER (WHERE status = 'PAGA')::BIGINT AS paid_installments,
        COUNT(*) FILTER (WHERE status = 'PENDENTE')::BIGINT AS pending_installments,
        COUNT(*) FILTER (WHERE status = 'ATRASADA')::BIGINT AS overdue_installments,
        COALESCE(SUM((SELECT get_installment_total_paid(fi.id))), 0) AS total_paid,
        COALESCE(SUM(CASE WHEN status IN ('PENDENTE', 'ATRASADA') THEN amount ELSE 0 END), 0) AS total_pending
    FROM public.financial_installments fi
    WHERE agreement_id = p_agreement_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 3. TRIGGERS AUTOMÁTICOS
-- ============================================================================

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_entities ON public.entities;
CREATE TRIGGER set_updated_at_entities
    BEFORE UPDATE ON public.entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_cases ON public.cases;
CREATE TRIGGER set_updated_at_cases
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_agreements ON public.financial_agreements;
CREATE TRIGGER set_updated_at_agreements
    BEFORE UPDATE ON public.financial_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_installments ON public.financial_installments;
CREATE TRIGGER set_updated_at_installments
    BEFORE UPDATE ON public.financial_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_petitions ON public.petitions;
CREATE TRIGGER set_updated_at_petitions
    BEFORE UPDATE ON public.petitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_templates ON public.document_templates;
CREATE TRIGGER set_updated_at_templates
    BEFORE UPDATE ON public.document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.user_profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para verificar conclusão de acordo
DROP TRIGGER IF EXISTS on_installment_paid ON public.financial_installments;
CREATE TRIGGER on_installment_paid
    AFTER UPDATE ON public.financial_installments
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION check_agreement_completion();

-- ============================================================================
-- 4. VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View: Resumo financeiro por processo
CREATE OR REPLACE VIEW vw_case_financial_summary AS
SELECT
    c.id AS case_id,
    c.case_number,
    c.title,
    c.status AS case_status,
    COUNT(DISTINCT fa.id) AS total_agreements,
    COALESCE(SUM(fa.total_amount), 0) AS total_agreement_value,
    COUNT(fi.id) AS total_installments,
    COUNT(fi.id) FILTER (WHERE fi.status = 'PAGA') AS paid_installments,
    COUNT(fi.id) FILTER (WHERE fi.status = 'PENDENTE') AS pending_installments,
    COUNT(fi.id) FILTER (WHERE fi.status = 'ATRASADA') AS overdue_installments
FROM public.cases c
LEFT JOIN public.financial_agreements fa ON c.id = fa.case_id
LEFT JOIN public.financial_installments fi ON fa.id = fi.agreement_id
GROUP BY c.id, c.case_number, c.title, c.status;

-- View: Parcelas a vencer (próximos 30 dias)
CREATE OR REPLACE VIEW vw_upcoming_installments AS
SELECT
    fi.id AS installment_id,
    fi.installment_number,
    fi.amount,
    fi.due_date,
    fi.status,
    c.case_number,
    c.title AS case_title,
    e.name AS debtor_name,
    fa.id AS agreement_id,
    (fi.due_date - CURRENT_DATE) AS days_until_due
FROM public.financial_installments fi
JOIN public.financial_agreements fa ON fi.agreement_id = fa.id
JOIN public.entities e ON fa.debtor_id = e.id
LEFT JOIN public.cases c ON fa.case_id = c.id
WHERE fi.status IN ('PENDENTE', 'ATRASADA')
AND fi.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY fi.due_date ASC;

-- View: Estatísticas do sistema
CREATE OR REPLACE VIEW vw_system_stats AS
SELECT
    (SELECT COUNT(*) FROM public.entities WHERE type = 'Cliente') AS total_clients,
    (SELECT COUNT(*) FROM public.entities WHERE type = 'Executado') AS total_defendants,
    (SELECT COUNT(*) FROM public.cases) AS total_cases,
    (SELECT COUNT(*) FROM public.cases WHERE status = 'Em Andamento') AS active_cases,
    (SELECT COUNT(*) FROM public.financial_agreements) AS total_agreements,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.financial_agreements) AS total_agreement_value,
    (SELECT COUNT(*) FROM public.financial_installments) AS total_installments,
    (SELECT COUNT(*) FROM public.financial_installments WHERE status = 'PENDENTE') AS pending_installments,
    (SELECT COUNT(*) FROM public.financial_installments WHERE status = 'ATRASADA') AS overdue_installments;

-- View: Pagamentos por mês
CREATE OR REPLACE VIEW vw_payments_by_month AS
SELECT
    DATE_TRUNC('month', fp.payment_date) AS month,
    COUNT(*) AS total_payments,
    SUM(fp.amount_paid) AS total_amount,
    fp.payment_method
FROM public.financial_payments fp
GROUP BY DATE_TRUNC('month', fp.payment_date), fp.payment_method
ORDER BY month DESC;

-- ============================================================================
-- 5. POLÍTICAS RLS ADICIONAIS
-- ============================================================================

-- Permitir INSERT/UPDATE/DELETE para usuários autenticados (ajuste conforme necessário)
DROP POLICY IF EXISTS authenticated_users_insert_entities ON public.entities;
CREATE POLICY authenticated_users_insert_entities
ON public.entities FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_users_update_entities ON public.entities;
CREATE POLICY authenticated_users_update_entities
ON public.entities FOR UPDATE TO authenticated
USING (true);

DROP POLICY IF EXISTS authenticated_users_insert_cases ON public.cases;
CREATE POLICY authenticated_users_insert_cases
ON public.cases FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_users_update_cases ON public.cases;
CREATE POLICY authenticated_users_update_cases
ON public.cases FOR UPDATE TO authenticated
USING (true);

DROP POLICY IF EXISTS authenticated_users_all_agreements ON public.financial_agreements;
CREATE POLICY authenticated_users_all_agreements
ON public.financial_agreements FOR ALL TO authenticated
USING (true);

DROP POLICY IF EXISTS authenticated_users_all_installments ON public.financial_installments;
CREATE POLICY authenticated_users_all_installments
ON public.financial_installments FOR ALL TO authenticated
USING (true);

DROP POLICY IF EXISTS authenticated_users_all_payments ON public.financial_payments;
CREATE POLICY authenticated_users_all_payments
ON public.financial_payments FOR ALL TO authenticated
USING (true);

DROP POLICY IF EXISTS users_own_notifications ON public.notifications;
CREATE POLICY users_own_notifications
ON public.notifications FOR ALL TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_own_profile ON public.user_profiles;
CREATE POLICY users_own_profile
ON public.user_profiles FOR ALL TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- CONCLUSÃO
-- ============================================================================

SELECT '✅ Script de melhorias executado com sucesso!' AS status,
       'Índices, triggers, funções e views foram criados' AS detalhes;
