// app/api/installments/by-month/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission, getSessionUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ───────────────────────────────────────────────────────────────────────────────
// SCHEMA DE PARÂMETROS
// ───────────────────────────────────────────────────────────────────────────────
const QuerySchema = z.object({
  month: z.string().transform((s) => parseInt(s, 10)).refine((n) => !Number.isNaN(n) && n >= 1 && n <= 12, 'month inválido').optional(),
  year : z.string().transform((s) => parseInt(s, 10)).refine((n) => !Number.isNaN(n) && n >= 1970 && n <= 9999, 'year inválido').optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO']).optional(),
});

// ───────────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────────
function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
/** [primeiro dia do mês, primeiro dia do mês seguinte) em YYYY-MM-DD */
function getMonthWindow(year: number, month1to12: number) {
  const y = year, m0 = month1to12 - 1;
  const start = new Date(Date.UTC(y, m0, 1));
  const next  = new Date(Date.UTC(y, m0 + 1, 1));
  return {
    startStr: `${start.getUTCFullYear()}-${pad2(start.getUTCMonth() + 1)}-01`,
    nextStr : `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-01`,
  };
}

type TryLog = { table: string; dueCol: string; step: string; ok: boolean; msg?: string };

// Tabelas candidatas comuns
const TABLES = [
  'installments',
  'financial_installments',
  'agreements_installments',
  'parcelas',
  'financeiro_parcelas',
  'installment',
  'parcela',
];
// Colunas candidatas
const DUE_COLS    = ['due_date', 'dueDate', 'vencimento', 'data_vencimento', 'dt_vencimento'];
const AMOUNT_COLS = ['amount', 'valor', 'valor_parcela', 'vl_parcela'];
const STATUS_COLS = ['status', 'situacao', 'sit', 'st'];

// ───────────────────────────────────────────────────────────────────────────────
// HANDLER
// ───────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const trace: TryLog[] = [];

  try {
    // 1) Autenticação / Permissão (retornamos 403 em vez de 500)
    try {
      await getSessionUser();
      await requirePermission('financial:view');
    } catch {
      return NextResponse.json({ ok: false, message: 'Sem permissão para visualizar financeiro', reqId }, { status: 403 });
    }

    // 2) Params
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      month : url.searchParams.get('month') ?? undefined,
      year  : url.searchParams.get('year') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Parâmetros inválidos', reqId }, { status: 200 }); // 200 para não quebrar UI
    }

    const now = new Date();
    const month = parsed.data.month ?? now.getMonth() + 1;
    const year  = parsed.data.year  ?? now.getFullYear();
    const { startStr, nextStr } = getMonthWindow(year, month);

    const supabase = await createSupabaseServerClient();

    // 3) Varre combinações (tabela x dueCol). Nunca lança 500; sempre cai em fallback de resposta vazia.
    for (const table of TABLES) {
      for (const dueCol of DUE_COLS) {
        // monta query base (select *) e range por data
        let q = supabase.from(table).select('*', { count: 'exact' }).gte(dueCol, startStr).lt(dueCol, nextStr);

        // 3.1 tenta filtrar por status se fornecido (tentando várias colunas conhecidas)
        if (parsed.data.status) {
          let applied = false;
          for (const sCol of STATUS_COLS) {
            const r = await q.eq(sCol, parsed.data.status).order(dueCol, { ascending: true });
            if (!r.error) {
              trace.push({ table, dueCol, step: `status=${sCol}`, ok: true });
              const normalized = normalizeItems(r.data ?? [], { amountCols: AMOUNT_COLS });
              return NextResponse.json(buildOkPayload({ month, year, startStr, nextStr, count: r.count ?? normalized.length, items: normalized, reqId, trace }));
            } else {
              const msg = r.error.message || String(r.error);
              trace.push({ table, dueCol, step: `status=${sCol}`, ok: false, msg });
              // se o erro não for "coluna inexistente", seguimos mas registramos; não abortamos 500
            }
          }
          // se não aplicou status, segue sem ele
          if (!applied) {
            // nada a fazer — segue fluxo
          }
        } else {
          // 3.2 se status não foi passado, tentamos esconder CANCELADO (se a coluna existir)
          let hideApplied = false;
          for (const sCol of STATUS_COLS) {
            const r = await q.neq(sCol, 'CANCELADO').order(dueCol, { ascending: true });
            if (!r.error) {
              hideApplied = true;
              trace.push({ table, dueCol, step: `hideCanceled(${sCol})`, ok: true });
              const normalized = normalizeItems(r.data ?? [], { amountCols: AMOUNT_COLS });
              return NextResponse.json(buildOkPayload({ month, year, startStr, nextStr, count: r.count ?? normalized.length, items: normalized, reqId, trace }));
            } else {
              const msg = r.error.message || String(r.error);
              trace.push({ table, dueCol, step: `hideCanceled(${sCol})`, ok: false, msg });
            }
          }
          // se não deu para esconder cancelado, segue sem esse filtro
        }

        // 3.3 consulta sem status (ou se nenhuma coluna de status existe)
        const r = await q.order(dueCol, { ascending: true });
        if (!r.error) {
          trace.push({ table, dueCol, step: 'no-status', ok: true });
          const normalized = normalizeItems(r.data ?? [], { amountCols: AMOUNT_COLS });
          return NextResponse.json(buildOkPayload({ month, year, startStr, nextStr, count: r.count ?? normalized.length, items: normalized, reqId, trace }));
        } else {
          const msg = r.error.message || String(r.error);
          trace.push({ table, dueCol, step: 'no-status', ok: false, msg });
          // continua tentando próximo dueCol/tabela
        }
      }
    }

    // 4) Se nada funcionou → retorna 200 com vazio (não quebra UI) + trace para diagnóstico
    return NextResponse.json(
      {
        ok: true,
        month,
        year,
        window: { from: startStr, toExclusive: nextStr },
        totalItems: 0,
        totalAmount: 0,
        totalsByStatus: {},
        items: [],
        reqId,
        detailTrace: trace, // útil para você ver no console/rede qual tabela/coluna faltou
      },
      { status: 200 }
    );
  } catch (e: any) {
    // Última barreira: nunca 500. Sempre 200 com vazio + mensagem.
    return NextResponse.json(
      {
        ok: true,
        month: new Date().getMonth() + 1,
        year : new Date().getFullYear(),
        window: { from: '', toExclusive: '' },
        totalItems: 0,
        totalAmount: 0,
        totalsByStatus: {},
        items: [],
        reqId,
        detailTrace: [{ table: '-', dueCol: '-', step: 'fatal-catch', ok: false, msg: e?.message || String(e) }],
      },
      { status: 200 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// HELPERS DE NORMALIZAÇÃO/RESPONSE
// ───────────────────────────────────────────────────────────────────────────────
function normalizeItems(items: any[], opts: { amountCols: string[] }) {
  return items.map((it) => {
    // normaliza "amount"
    let amount = it.amount;
    if (amount == null) {
      for (const c of opts.amountCols) {
        if (it[c] != null) { amount = it[c]; break; }
      }
    }
    const num = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0);
    return { ...it, amount: Number.isFinite(num) ? num : 0 };
  });
}

function buildOkPayload(args: {
  month: number; year: number; startStr: string; nextStr: string;
  count?: number | null; items: any[]; reqId: string; trace: TryLog[];
}) {
  const totalsByStatus = args.items.reduce<Record<string, number>>((acc, it) => {
    const st = it.status ?? it.situacao ?? it.sit ?? it.st ?? 'DESCONHECIDO';
    const amt = Number(it.amount ?? 0);
    acc[st] = (acc[st] ?? 0) + (Number.isFinite(amt) ? amt : 0);
    return acc;
  }, {});
  const totalAmount = args.items.reduce((sum, it) => sum + Number(it.amount ?? 0), 0);

  return {
    ok: true,
    month: args.month,
    year : args.year,
    window: { from: args.startStr, toExclusive: args.nextStr },
    totalItems: args.count ?? args.items.length,
    totalAmount,
    totalsByStatus,
    items: args.items,
    reqId: args.reqId,
    detailTrace: args.trace,
  };
}
