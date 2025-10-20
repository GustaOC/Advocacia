-- Debug: Verificar parcelas do mês atual
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- 1. Total de acordos financeiros
SELECT COUNT(*) as total_acordos FROM financial_agreements;

-- 2. Total de parcelas cadastradas
SELECT COUNT(*) as total_parcelas FROM financial_installments;

-- 3. Parcelas por acordo
SELECT
  fa.id as acordo_id,
  COUNT(fi.id) as qtd_parcelas
FROM financial_agreements fa
LEFT JOIN financial_installments fi ON fi.agreement_id = fa.id
GROUP BY fa.id
ORDER BY fa.id;

-- 4. Parcelas do mês atual (Outubro 2025)
SELECT
  fi.*,
  fa.id as acordo_id
FROM financial_installments fi
LEFT JOIN financial_agreements fa ON fa.id = fi.agreement_id
WHERE fi.due_date >= '2025-10-01'
  AND fi.due_date < '2025-11-01'
ORDER BY fi.due_date;

-- 5. Contar parcelas por mês
SELECT
  DATE_TRUNC('month', due_date) as mes,
  COUNT(*) as qtd_parcelas
FROM financial_installments
GROUP BY DATE_TRUNC('month', due_date)
ORDER BY mes DESC
LIMIT 12;

-- 6. Acordos sem parcelas
SELECT
  fa.id,
  fa.total_amount,
  fa.number_of_installments
FROM financial_agreements fa
LEFT JOIN financial_installments fi ON fi.agreement_id = fa.id
WHERE fi.id IS NULL;
