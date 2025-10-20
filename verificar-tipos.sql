-- Verificar tipos das tabelas financeiras
SELECT
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('financial_installments', 'financial_payments', 'financial_agreements')
ORDER BY table_name, ordinal_position;
