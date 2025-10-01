// lib/services/financialService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";
import {
  EnhancedAgreement,
  Installment,
  Payment,
  PaymentSchema,
} from "@/lib/schemas";

/** Converte string | Date para Date */
function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

export class FinancialService {
  /**
   * Parcelas por mês/ano para a aba "PARCELAS DO MÊS".
   * Normaliza para o shape que o front espera:
   * - due_date: string "YYYY-MM-DD"
   * - amount: number
   * - status: 'PENDENTE' | 'PAGA' | 'ATRASADA'
   * - agreement: { id, cases, debtor } | null
   */
  static async getInstallmentsByMonthYear(
    year: number,
    month: number,
    authUser: AuthUser
  ): Promise<
    Array<{
      id: number;
      due_date: string;
      amount: number;
      status: "PENDENTE" | "PAGA" | "ATRASADA";
      agreement: {
        id: number;
        cases: {
          case_number: string | null;
          title: string;
          case_parties?: { role: string; entities: { name: string } }[];
        } | null;
        debtor: { name: string } | null;
      } | null;
    }>
  > {
    const supabase = createAdminClient();

    // Delimita o mês em UTC para evitar off-by-one
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const nextMonth = new Date(Date.UTC(year, month, 1));

    // 1) Parcelas do mês
    const { data: installments, error: instError } = await supabase
      .from("financial_installments")
      .select(`
        id,
        agreement_id,
        installment_number,
        amount,
        due_date,
        status,
        created_at,
        updated_at
      `)
      .gte("due_date", firstDay.toISOString().slice(0, 10))
      .lt("due_date", nextMonth.toISOString().slice(0, 10))
      .order("due_date", { ascending: true });

    if (instError) {
      console.error("Erro ao buscar parcelas do mês:", instError);
      throw new Error("Não foi possível buscar as parcelas do mês.");
    }

    // 2) Busca acordos relacionados para enriquecer o campo 'agreement'
    const agreementIds = Array.from(
      new Set(((installments as any[]) || []).map((i) => i.agreement_id).filter(Boolean))
    );

    const agreementsById: Record<string, EnhancedAgreement> = {};
    if (agreementIds.length > 0) {
      const { data: agreements, error: agErr } = await supabase
        .from("financial_agreements")
        .select(`
          id,
          start_date,
          end_date,
          status,
          agreement_type,
          notes,
          created_at,
          updated_at,

          cases:case_id (
            case_number,
            title,
            case_parties (
              role,
              entities:entity_id (
                name
              )
            )
          ),

          debtor:debtor_id (
            name
          )
        `)
        .in("id", agreementIds as string[]);

      if (agErr) {
        console.error("Erro ao buscar acordos relacionados:", agErr);
      } else if (agreements) {
        for (const ag of agreements as any[]) {
          agreementsById[String(ag.id)] = {
            ...ag,
            start_date: toDate(ag.start_date),
            end_date: toDate(ag.end_date),
          } as EnhancedAgreement;
        }
      }
    }

    // 3) Normalização: shape compatível com a interface MonthlyInstallment do front
    return ((installments as any[]) || []).map((it) => {
      const agreement = (it.agreement_id && agreementsById[it.agreement_id]) || null;

      const due =
        it.due_date instanceof Date ? it.due_date : new Date(it.due_date);

      return {
        id: Number(it.id),
        due_date: due.toISOString().slice(0, 10), // string "YYYY-MM-DD"
        amount: Number(it.amount),
        status: it.status as "PENDENTE" | "PAGA" | "ATRASADA",
        agreement: agreement
          ? {
              id: Number((agreement as any).id),
              cases: agreement.cases
                ? {
                    case_number: (agreement.cases as any).case_number ?? null,
                    title: (agreement.cases as any).title,
                    case_parties:
                      (agreement.cases as any).case_parties?.map((p: any) => ({
                        role: p.role,
                        entities: { name: p.entities?.name ?? "" },
                      })) ?? [],
                  }
                : null,
              debtor: agreement.debtor
                ? { name: (agreement.debtor as any).name ?? "" }
                : null,
            }
          : null,
      };
    });
  }

  /** Parcelas por acordo */
  static async getInstallmentsByAgreement(
    agreementId: string
  ): Promise<Installment[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("financial_installments")
      .select(`
        id,
        agreement_id,
        installment_number,
        amount,
        due_date,
        status,
        created_at,
        updated_at
      `)
      .eq("agreement_id", agreementId)
      .order("installment_number", { ascending: true });

    if (error) {
      console.error(`Erro ao buscar parcelas para o acordo ${agreementId}:`, error);
      throw new Error("Não foi possível buscar as parcelas.");
    }

    // Retorno explícito como Installment[]
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
   * Registrar pagamento de parcela
   * (Assinatura do logAudit: (action, user, details))
   */
  static async recordPayment(
    authUser: AuthUser,
    data: z.infer<typeof PaymentSchema>
  ): Promise<Payment> {
    const parsed = PaymentSchema.parse(data);

    const supabase = createAdminClient();

    const {
      installment_id,
      amount_paid,
      payment_date,
      payment_method,
      notes,
    } = parsed;

    // Insere pagamento
    const { data: inserted, error: insertErr } = await supabase
      .from("financial_payments")
      .insert([
        {
          installment_id,
          amount_paid: Number(amount_paid),
          payment_date:
            payment_date instanceof Date
              ? payment_date.toISOString()
              : new Date(payment_date as unknown as string).toISOString(),
          payment_method,
          notes: notes ?? null,
          created_by: authUser.id,
        },
      ])
      .select(`
        id,
        installment_id,
        amount_paid,
        payment_date,
        payment_method,
        notes,
        created_at
      `)
      .single();

    if (insertErr) {
      console.error("Erro ao registrar pagamento:", insertErr);
      throw new Error("Não foi possível registrar o pagamento.");
    }

    // Atualiza status da parcela se cobriu o valor
    const { data: instData, error: instErr } = await supabase
      .from("financial_installments")
      .select(`amount`)
      .eq("id", installment_id)
      .single();

    if (!instErr) {
      const installmentAmount = Number(instData?.amount ?? 0);
      const paidAmount = Number(amount_paid);
      const newStatus = paidAmount >= installmentAmount ? "PAGA" : "PENDENTE";

      const { error: updErr } = await supabase
        .from("financial_installments")
        .update({ status: newStatus })
        .eq("id", installment_id);

      if (updErr) {
        console.error("Falha ao atualizar status da parcela:", updErr);
      }
    }

    // AUDITORIA — ordem e ação corretas
    await logAudit("PAYMENT_RECORDED", authUser, {
      installmentId: installment_id,
      amount: Number(amount_paid),
    });

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
