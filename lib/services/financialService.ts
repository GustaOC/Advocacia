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

function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

export class FinancialService {
  static async getInstallmentsByMonthYear(
    year: number,
    month: number,
    user: AuthUser
  ): Promise<Array<Installment & { agreement?: EnhancedAgreement | null }>> {
    const supabase = createAdminClient();

    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const nextMonth = new Date(Date.UTC(year, month, 1));

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
      console.error(`Erro ao buscar parcelas para ${month}/${year}:`, instError);
      throw new Error("Não foi possível buscar as parcelas do mês.");
    }
    if (!installments || installments.length === 0) return [];

    const agreementIds = Array.from(
      new Set(installments.map((i: any) => i.agreement_id).filter(Boolean))
    ) as string[];

    let agreementsById: Record<string, EnhancedAgreement> = {};
    if (agreementIds.length > 0) {
      const { data: agreements, error: agErr } = await supabase
        .from("financial_agreements").select(`
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
          updated_at
        
        ,
        cases:case_id (
          case_number,
          title
        ),
        debtor:debtor_id (
          name
        )
    
        `)
        .in("id", agreementIds as string[]);

      if (!agErr && agreements) {
        for (const ag of agreements as any[]) {
          agreementsById[ag.id as string] = {
            ...ag,
            start_date: toDate(ag.start_date),
            end_date: toDate(ag.end_date),
          } as EnhancedAgreement;
        }
      } else if (agErr) {
        console.error("Erro ao buscar acordos relacionados:", agErr);
      }
    }

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

  static async getInstallmentsByAgreement(agreementId: string): Promise<Installment[]> {
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

  static async getInstallmentById(installmentId: string): Promise<Installment | null> {
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
      created_at: data.created_at ? new Date(data.created_at).toISOString() : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
    };
  }

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
          payment_date: new Date(payment_date as unknown as string),
          payment_method,
          notes: notes ?? null,
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
      console.error("Erro ao atualizar status da parcela (pagamento desfeito):", updateError);
      throw new Error("O pagamento foi registrado, mas falhou ao atualizar a parcela. A operação foi desfeita.");
    }

    await logAudit("PAYMENT_RECORDED" as any, user, {
      paymentId: newPayment.id,
      installmentId: installment_id,
      amount: Number(amount_paid),
    });

    return {
      id: newPayment.id,
      installment_id: newPayment.installment_id,
      amount_paid: Number(newPayment.amount_paid),
      payment_date: new Date(newPayment.payment_date),
      payment_method: newPayment.payment_method,
      notes: newPayment.notes ?? undefined,
      created_at: newPayment.created_at ? new Date(newPayment.created_at) : undefined,
    } as Payment;
  }
}
