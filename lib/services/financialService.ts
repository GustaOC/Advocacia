// lib/services/financialService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AuthUser } from "@/lib/auth";
import { Installment, Payment, PaymentSchema } from "@/lib/schemas";

// Função auxiliar para auditoria
async function logAudit(action: string, user: AuthUser, data: any) {
  try {
    console.log(`📝 [AUDIT] ${action}:`, { userId: user.id, data });
  } catch (e) {
    console.warn("⚠️ Falha ao registrar auditoria:", e);
  }
}

/** YYYY-MM-DD baseado na data local (sem UTC) */
function toIsoDateOnly(d: string | Date): string {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converte string | Date para Date (mantém compat c/ tipos existentes) */
function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Normaliza status para 'PENDENTE' | 'PAGA' | 'ATRASADA' */
function normalizeStatus(raw?: string): "PENDENTE" | "PAGA" | "ATRASADA" {
  const s = String(raw ?? "").toUpperCase();
  if (s === "PAGO" || s === "PAGA" || s === "PAID") return "PAGA";
  if (s === "ATRASADO" || s === "ATRASADA" || s === "OVERDUE") return "ATRASADA";
  return "PENDENTE";
}

/** DTO usado pelo front em Parcelas do Mês */
export type MonthlyInstallmentDTO = {
  id: number;
  due_date: string; // YYYY-MM-DD
  amount: number;
  status: "PENDENTE" | "PAGA" | "ATRASADA";
  agreement: {
    id: number;
    cases: {
      case_number: string | null;
      title: string | null;
      case_parties?: { role: string; entities: { name: string } }[];
    } | null;
    debtor: { name: string } | null;
  } | null;
};

export class FinancialService {
  /**
   * PARCELAS POR MÊS/ANO
   * - Busca parcelas no intervalo [1º dia, 1º dia do mês seguinte) em datas locais
   * - Resolve relacionamentos com queries planas (sem nested select)
   * - Tolera falhas parciais (segue com dados parciais)
   */
  static async getInstallmentsByMonthYear(
    year: number,
    month: number,
    _authUser: AuthUser
  ): Promise<MonthlyInstallmentDTO[]> {
    const supabase = createAdminClient();

    // 1) Janela de datas em YYYY-MM-DD (local)
    const startStr = toIsoDateOnly(new Date(year, month - 1, 1));
    const endStr = toIsoDateOnly(new Date(year, month, 1));

    console.log(`🔍 Buscando parcelas do período [${startStr}, ${endStr})`);

    // 2) Parcelas do mês (sem QUALQUER nested select)
    const { data: installments, error: instError } = await supabase
      .from("financial_installments")
      .select("id, agreement_id, installment_number, amount, due_date, status")
      .gte("due_date", startStr)
      .lt("due_date", endStr)
      .order("due_date", { ascending: true });

    if (instError) {
      console.error("❌ Erro ao buscar parcelas do mês:", instError);
      throw new Error("Não foi possível buscar as parcelas do mês.");
    }

    const safeInstallments = (installments ?? []) as any[];
    console.log(
      `📊 Encontradas ${safeInstallments.length} parcelas para ${month}/${year}`
    );

    // 3) Resolver relacionamentos com consultas planas
    const agreementIds = Array.from(
      new Set(safeInstallments.map((i) => i.agreement_id).filter(Boolean))
    ) as number[];

    const agreementsById: Record<
      number,
      { id: number; case_id: number | null; debtor_id: number | null }
    > = {};
    const casesById: Record<
      number,
      { case_number: string | null; title: string | null }
    > = {};
    const debtorNamesById: Record<number, string> = {};
    const casePartiesByCaseId: Record<
      number,
      Array<{ role: string; name: string }>
    > = {};

    if (agreementIds.length > 0) {
      // 3.1) financial_agreements -> chaves mínimas
      const { data: ags, error: agErr } = await supabase
        .from("financial_agreements")
        .select("id, case_id, debtor_id")
        .in("id", agreementIds);
      if (agErr) {
        console.warn(
          "⚠️ Falha ao buscar acordos (seguindo com dados parciais):",
          agErr
        );
      } else {
        for (const ag of ags ?? []) {
          agreementsById[Number(ag.id)] = {
            id: Number(ag.id),
            case_id: ag.case_id ?? null,
            debtor_id: ag.debtor_id ?? null,
          };
        }
      }

      // 3.2) cases -> número e título
      const caseIds = Array.from(
        new Set(Object.values(agreementsById).map((a) => a.case_id).filter(Boolean))
      ) as number[];
      if (caseIds.length > 0) {
        const { data: cs, error: cErr } = await supabase
          .from("cases")
          .select("id, case_number, title")
          .in("id", caseIds);
        if (cErr) {
          console.warn("⚠️ Falha ao buscar processos:", cErr);
        } else {
          for (const c of cs ?? []) {
            casesById[Number(c.id)] = {
              case_number: c.case_number ?? null,
              title: c.title ?? null,
            };
          }
        }

        // 3.3) case_parties -> papeis + ids de entidades
        const { data: cps, error: cpErr } = await supabase
          .from("case_parties")
          .select("case_id, role, entity_id")
          .in("case_id", caseIds);
        if (cpErr) {
          console.warn("⚠️ Falha ao buscar partes do processo:", cpErr);
        } else {
          const entityIds = Array.from(
            new Set((cps ?? []).map((p) => p.entity_id).filter(Boolean))
          ) as number[];

          // 3.3.1) entities -> nomes das entidades
          let entitiesById: Record<number, string> = {};
          if (entityIds.length > 0) {
            const { data: ents, error: eErr } = await supabase
              .from("entities")
              .select("id, name")
              .in("id", entityIds);
            if (eErr) {
              console.warn("⚠️ Falha ao buscar entidades (nomes):", eErr);
            } else {
              for (const e of ents ?? []) {
                entitiesById[Number(e.id)] = e.name ?? "";
              }
            }
          }

          // montar map por case_id
          for (const p of cps ?? []) {
            const cid = Number(p.case_id);
            const name = p.entity_id
              ? entitiesById[Number(p.entity_id)] ?? ""
              : "";
            if (!casePartiesByCaseId[cid]) casePartiesByCaseId[cid] = [];
            casePartiesByCaseId[cid].push({ role: p.role, name });
          }
        }
      }

      // 3.4) devedores -> entities (nomes)
      const debtorIds = Array.from(
        new Set(
          Object.values(agreementsById).map((a) => a.debtor_id).filter(Boolean)
        )
      ) as number[];
      if (debtorIds.length > 0) {
        const { data: debtors, error: dErr } = await supabase
          .from("entities")
          .select("id, name")
          .in("id", debtorIds);
        if (dErr) {
          console.warn("⚠️ Falha ao buscar devedores:", dErr);
        } else {
          for (const d of debtors ?? []) {
            debtorNamesById[Number(d.id)] = d.name ?? "";
          }
        }
      }
    }

    // 4) Normalização final -> MonthlyInstallmentDTO[]
    const result: MonthlyInstallmentDTO[] = safeInstallments.map((it) => {
      const ag = it.agreement_id
        ? agreementsById[Number(it.agreement_id)]
        : undefined;
      const caseId = ag?.case_id ?? null;
      const debtorId = ag?.debtor_id ?? null;

      return {
        id: Number(it.id),
        due_date:
          typeof it.due_date === "string"
            ? it.due_date.split("T")[0]
            : toIsoDateOnly(it.due_date),
        amount: Number(it.amount) || 0,
        status: normalizeStatus(it.status),
        agreement: ag
          ? {
              id: Number(ag.id),
              cases: caseId
                ? {
                    case_number: casesById[caseId]?.case_number ?? null,
                    title: casesById[caseId]?.title ?? null,
                    case_parties: (casePartiesByCaseId[caseId] ?? []).map(
                      (p) => ({
                        role: p.role,
                        entities: { name: p.name },
                      })
                    ),
                  }
                : null,
              debtor: debtorId
                ? { name: debtorNamesById[debtorId] ?? "" }
                : null,
            }
          : null,
      };
    });

    console.log(`✅ Parcelas normalizadas: ${result.length}`);
    return result;
  }

  /**
   * DEBUG: Lista todas as parcelas e filtra por mês/ano no Node
   */
  static async debugInstallments(year: number, month: number) {
    const supabase = createAdminClient();

    console.log("🔍 [DEBUG] Buscando TODAS as parcelas do banco...");
    const { data: allInstallments, error } = await supabase
      .from("financial_installments")
      .select("id, agreement_id, installment_number, amount, due_date, status")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("❌ [DEBUG] Erro ao buscar parcelas:", error);
      return [];
    }

    console.log(`📊 [DEBUG] Total de parcelas no banco: ${allInstallments?.length ?? 0}`);

    const monthInstallments =
      allInstallments?.filter((inst) => {
        try {
          const d = new Date(inst.due_date);
          return (
            d.getFullYear() === year && d.getMonth() + 1 === month
          );
        } catch {
          return false;
        }
      }) ?? [];

    console.log(`📅 [DEBUG] Parcelas do mês ${month}/${year}: ${monthInstallments.length}`);
    console.log(`📊 [DEBUG] Acordos com parcelas neste mês:`, 
      [...new Set(monthInstallments.map((i) => i.agreement_id))]
    );

    return monthInstallments;
  }

  /**
   * Parcelas por acordo
   */
  static async getInstallmentsByAgreement(
    agreementId: string
  ): Promise<Installment[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("financial_installments")
      .select(
        "id, agreement_id, installment_number, amount, due_date, status, created_at, updated_at"
      )
      .eq("agreement_id", agreementId)
      .order("installment_number", { ascending: true });

    if (error) {
      console.error(
        `Erro ao buscar parcelas para o acordo ${agreementId}:`,
        error
      );
      throw new Error("Não foi possível buscar as parcelas.");
    }

    return ((data as any[]) || []).map((x) => ({
      id: x.id,
      agreement_id: x.agreement_id ?? undefined,
      installment_number: Number(x.installment_number),
      amount: Number(x.amount),
      due_date: toDate(x.due_date),
      status: x.status,
      created_at: x.created_at ? new Date(x.created_at) : undefined,
      updated_at: x.updated_at ? new Date(x.updated_at) : undefined,
    })) as Installment[];
  }

  /**
   * Buscar parcela por ID (usado na validação de pagamentos)
   */
  static async getInstallmentById(installmentId: string): Promise<Installment | null> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("financial_installments")
      .select("id, agreement_id, installment_number, amount, due_date, status, created_at, updated_at")
      .eq("id", installmentId)
      .single();

    if (error) {
      console.error(`Erro ao buscar parcela ${installmentId}:`, error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      agreement_id: data.agreement_id ?? undefined,
      installment_number: Number(data.installment_number),
      amount: Number(data.amount),
      due_date: toDate(data.due_date),
      status: data.status,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
    } as Installment;
  }

  /**
   * Registrar pagamento de parcela (assinatura compatível com a rota de API)
   */
  static async recordPaymentForInstallment(
    data: z.infer<typeof PaymentSchema>,
    authUser: AuthUser
  ): Promise<Payment> {
    return this.recordPayment(authUser, data);
  }

  /**
   * Registrar pagamento de parcela (método interno)
   * - Insere pagamento
   * - Atualiza status da parcela (best effort)
   * - Registra auditoria (best effort)
   */
  static async recordPayment(
    authUser: AuthUser,
    data: z.infer<typeof PaymentSchema>
  ): Promise<Payment> {
    const parsed = PaymentSchema.parse(data);
    const supabase = createAdminClient();

    // 1) Inserir pagamento
    const { data: inserted, error: insertErr } = await supabase
      .from("financial_payments")
      .insert([
        {
          installment_id: parsed.installment_id,
          amount_paid: Number(parsed.amount_paid),
          payment_date:
            parsed.payment_date instanceof Date
              ? parsed.payment_date.toISOString()
              : new Date(
                  parsed.payment_date as unknown as string
                ).toISOString(),
          payment_method: parsed.payment_method,
          notes: parsed.notes ?? null,
          created_by: authUser.id,
        },
      ])
      .select(
        "id, installment_id, amount_paid, payment_date, payment_method, notes, created_at"
      )
      .single();

    if (insertErr || !inserted) {
      console.error("Erro ao registrar pagamento:", insertErr);
      throw new Error("Não foi possível registrar o pagamento.");
    }

    // 2) Atualizar status da parcela (best effort)
    try {
      const { data: instData, error: instErr } = await supabase
        .from("financial_installments")
        .select("amount")
        .eq("id", parsed.installment_id)
        .single();

      if (!instErr && instData) {
        const installmentAmount = Number(instData.amount ?? 0);
        const paidAmount = Number(parsed.amount_paid);
        const newStatus = paidAmount >= installmentAmount ? "PAGA" : "PENDENTE";

        const { error: updErr } = await supabase
          .from("financial_installments")
          .update({ status: newStatus })
          .eq("id", parsed.installment_id);

        if (updErr) {
          console.warn(
            "⚠️ Pagamento inserido, mas falhou atualização de status:",
            updErr
          );
        }
      } else {
        console.warn(
          "⚠️ Pagamento inserido, mas não foi possível ler o valor da parcela:",
          instErr
        );
      }
    } catch (e) {
      console.warn(
        "⚠️ Pagamento inserido, mas ocorreu erro inesperado ao atualizar status:",
        e
      );
    }

    // 3) Auditoria (best effort)
    try {
      await logAudit("PAYMENT_RECORDED", authUser, {
        installmentId: parsed.installment_id,
        amount: Number(parsed.amount_paid),
      });
    } catch (e) {
      console.warn("⚠️ Falha ao registrar auditoria de pagamento:", e);
    }

    // 4) Retorno tipado
    return {
      id: inserted.id,
      installment_id: inserted.installment_id,
      amount_paid: Number(inserted.amount_paid),
      payment_date: new Date(inserted.payment_date),
      payment_method: inserted.payment_method,
      notes: inserted.notes ?? undefined,
      created_at: inserted.created_at ? new Date(inserted.created_at) : undefined,
    } as Payment;
  }
}