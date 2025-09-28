// lib/services/financialService.ts
// Serviço financeiro consolidado para acesso às tabelas:
//   - public.financial_agreements
//   - public.financial_installments
//   - public.financial_payments
//
// Observações de design:
// - Usa createAdminClient para contornar RLS no backend (ajuste se necessário).
// - Normaliza campos conforme tipos do schemas.ts (Installment.created_at/updated_at = string).

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

/** Utilitário: converte string | Date em Date */
function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

export class FinancialService {
  /**
   * Retorna parcelas por mês/ano, juntando acordo relacionado.
   * Usado por /api/installments/by-month
   */
  static async getInstallmentsByMonthYear(
    year: number,
    month: number,
    user: AuthUser
  ): Promise<
    Array<
      Installment & {
        agreement?: EnhancedAgreement | null;
      }
    >
  > {
    const supabase = createAdminClient();

    // Intervalo [firstDay, nextMonth)
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const nextMonth = new Date(Date.UTC(year, month, 1));

    const { data: installments, error: instError } = await supabase
      .from("financial_installments")
      .select(
        `
        id,
        agreement_id,
        installment_number,
        amount,
        due_date,
        status,
        created_at,
        updated_at
      `
      )
      .gte("due_date", firstDay.toISOString().slice(0, 10))
      .lt("due_date", nextMonth.toISOString().slice(0, 10))
      .order("due_date", { ascending: true });

    if (instError) {
      console.error(`Erro ao buscar parcelas para ${month}/${year}:`, instError);
      throw new Error("Não foi possível buscar as parcelas do mês.");
    }

    if (!installments || installments.length === 0) return [];

    // Buscar acordos relacionados
    const agreementIds = Array.from(
      new Set(installments.map((i: any) => i.agreement_id).filter(Boolean))
    );

    let agreementsById: Record<string, EnhancedAgreement> = {};
    if (agreementIds.length > 0) {
      const { data: agreements, error: agErr } = await supabase
        .from("financial_agreements")
        .select(
          `
          id,
          case_id,
          debtor_id,
          creditor_id,
          total_amount,
          down_payment,
          number_of_installments,
          start_date,
          end_date,
          status,
          agreement_type,
          notes,
          created_at,
          updated_at,
          cases:cases (
            id,
            title,
            entity_id
          )
        `
        )
        .in("id", agreementIds as string[]);

      if (agErr) {
        console.error("Erro ao buscar acordos relacionados:", agErr);
      } else if (agreements) {
        for (const ag of agreements as any[]) {
          agreementsById[ag.id as string] = {
            ...ag,
            start_date: toDate(ag.start_date),
            end_date: toDate(ag.end_date),
          } as EnhancedAgreement;
        }
      }
    }

    // Normaliza Installment conforme schema.ts: created_at/updated_at -> string | undefined
    return (installments as any[]).map((it) => {
      const agreement =
        (it.agreement_id && agreementsById[it.agreement_id]) || null;

      const normalized: Installment & { agreement?: EnhancedAgreement | null } = {
        id: it.id,
        agreement_id: it.agreement_id ?? undefined,
        installment_number: Number(it.installment_number),
        amount: Number(it.amount),
        due_date: toDate(it.due_date),
        status: it.status,
        created_at: it.created_at ? new Date(it.created_at).toISOString() : undefined,
        updated_at: it.updated_at ? new Date(it.updated_at).toISOString() : undefined,
        agreement,
      };

      return normalized;
    });
  }

  /**
   * Busca todas as parcelas de um acordo.
   */
  static async getInstallmentsByAgreement(
    agreementId: string
  ): Promise<Installment[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("financial_installments")
      .select(
        `
        id,
        agreement_id,
        installment_number,
        amount,
        due_date,
        status,
        created_at,
        updated_at
      `
      )
      .eq("agreement_id", agreementId)
      .order("installment_number", { ascending: true });

    if (error) {
      console.error(`Erro ao buscar parcelas para o acordo ${agreementId}:`, error);
      throw new Error("Não foi possível buscar as parcelas.");
    }

    return ((data as any[]) || []).map((x) => ({
      id: x.id,
      agreement_id: x.agreement_id ?? undefined,
      installment_number: Number(x.installment_number),
      amount: Number(x.amount),
      due_date: toDate(x.due_date),
      status: x.status,
      created_at: x.created_at ? new Date(x.created_at).toISOString() : undefined,
      updated_at: x.updated_at ? new Date(x.updated_at).toISOString() : undefined,
    }));
  }

  /**
   * (Opcional) Cria acordo com parcelas via RPC, se existir a função.
   * Removido uso de EnhancedAgreementSchema.partial() (quebrava por ser ZodEffects).
   * Caso a RPC não exista, adapte para criação transacional.
   */
  static async createAgreementWithInstallments(
    agreement: any,
    installments: Array<
      { installment_number?: number; amount: number; due_date: string | Date; status?: string }
    >,
    user: AuthUser
  ) {
    const supabase = createAdminClient();

    const normalizedInstallments = installments.map((i, idx) => ({
      installment_number: i.installment_number ?? idx + 1,
      amount: Number(i.amount),
      due_date: toDate(i.due_date),
      status: i.status ?? "PENDENTE",
    }));

    const { data, error } = await supabase.rpc(
      "create_agreement_with_installments",
      {
        agreement_data: {
          ...agreement,
          start_date: toDate(agreement.start_date),
          end_date: toDate(agreement.end_date),
        },
        installments_data: normalizedInstallments,
      }
    );

    if (error) {
      console.error("Erro na RPC ao criar acordo financeiro:", error);
      throw new Error(
        "Não foi possível criar o acordo. Verifique a existência da função RPC ou implemente criação transacional."
      );
    }

    // Removido logAudit com 'AGREEMENT_CREATED' para evitar erro de tipo (AuditAction).
    return data;
  }

  /**
   * Registra um pagamento para uma parcela e atualiza seu status.
   */
  static async recordPaymentForInstallment(
    paymentData: z.infer<typeof PaymentSchema>,
    user: AuthUser
  ): Promise<Payment> {
    const supabase = createAdminClient();
    const { installment_id, amount_paid, payment_date, payment_method, notes } =
      paymentData;

    const { data: newPayment, error: paymentError } = await supabase
      .from("financial_payments")
      .insert([
        {
          installment_id,
          amount_paid: Number(amount_paid),
          payment_date: toDate(payment_date as unknown as string),
          payment_method,
          notes: notes ?? null,
        },
      ])
      .select(
        `
        id,
        installment_id,
        amount_paid,
        payment_date,
        payment_method,
        notes,
        created_at
      `
      )
      .single();

    if (paymentError || !newPayment) {
      console.error("Erro ao registrar pagamento:", paymentError?.message);
      throw new Error("Não foi possível registrar o pagamento.");
    }

    const { error: updateError } = await supabase
      .from("financial_installments")
      .update({ status: "PAGA" })
      .eq("id", installment_id);

    if (updateError) {
      await supabase.from("financial_payments").delete().eq("id", newPayment.id);
      console.error(
        "Erro ao atualizar status da parcela (pagamento desfeito):",
        updateError
      );
      throw new Error(
        "O pagamento foi registrado, mas falhou ao atualizar a parcela. A operação foi desfeita."
      );
    }

    // Mantido: ação já existia no projeto; se tipagem falhar, ajuste AuditAction no auditService.ts
    await logAudit("PAYMENT_RECORDED" as any, user, {
      paymentId: newPayment.id,
      installmentId: installment_id,
      amount: Number(amount_paid),
    });

    return {
      id: newPayment.id,
      installment_id: newPayment.installment_id,
      amount_paid: Number(newPayment.amount_paid),
      payment_date: toDate(newPayment.payment_date),
      payment_method: newPayment.payment_method,
      notes: newPayment.notes ?? undefined,
      created_at: newPayment.created_at ? new Date(newPayment.created_at) : undefined,
    } as Payment;
  }
}
