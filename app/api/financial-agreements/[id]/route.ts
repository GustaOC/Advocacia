// app/api/financial-agreements/[id]/route.ts - VERSÃO EXPANDIDA
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter um acordo financeiro específico com todos os detalhes expandidos
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_view");
    const agreement = await financialService.getFinancialAgreementById(params.id);

    if (!agreement) {
      return NextResponse.json({ error: "Acordo não encontrado." }, { status: 404 });
    }
    
    return NextResponse.json(agreement);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// PUT: Atualizar um acordo financeiro
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_edit");
    const body = await req.json();
    const updatedAgreement = await financialService.updateFinancialAgreement(params.id, body);
    return NextResponse.json(updatedAgreement);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// DELETE: Cancelar um acordo financeiro
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_delete");
    await financialService.cancelFinancialAgreement(params.id);
    return NextResponse.json({ message: "Acordo cancelado com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// app/api/financial-agreements/[id]/installments/route.ts - NOVA ROTA PARA PARCELAS
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter todas as parcelas de um acordo
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_view");
    const installments = await financialService.getAgreementInstallments(params.id);
    return NextResponse.json(installments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// app/api/financial-agreements/[id]/renegotiate/route.ts - NOVA ROTA PARA RENEGOCIAÇÃO
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST: Renegociar um acordo financeiro
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_edit");
    const body = await req.json();
    const renegotiatedAgreement = await financialService.renegotiateFinancialAgreement(params.id, body);
    return NextResponse.json(renegotiatedAgreement);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos para renegociação.", issues: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// app/api/financial-agreements/[id]/payments/route.ts - NOVA ROTA PARA PAGAMENTOS
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST: Registrar pagamento de parcela
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_edit");
    const body = await req.json();
    const { installmentId, ...paymentData } = body;
    
    if (!installmentId) {
      return NextResponse.json(
        { error: "ID da parcela é obrigatório." },
        { status: 400 }
      );
    }
    
    await financialService.recordInstallmentPayment(installmentId, paymentData);
    return NextResponse.json({ message: "Pagamento registrado com sucesso." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// GET: Obter histórico de pagamentos de um acordo
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("financial_view");
    const paymentHistory = await financialService.getAgreementPaymentHistory(params.id);
    return NextResponse.json(paymentHistory);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// app/api/financial-agreements/reports/route.ts - NOVA ROTA PARA RELATÓRIOS
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

// GET: Gerar relatórios financeiros
export async function GET(req: NextRequest) {
  try {
    await requirePermission("financial_view");
    
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'general';
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Período de data é obrigatório (startDate e endDate)." },
        { status: 400 }
      );
    }
    
    const reportData = await financialService.getFinancialReports(startDate, endDate, reportType);
    return NextResponse.json(reportData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// app/api/financial-agreements/overdue/route.ts - NOVA ROTA PARA ACORDOS EM ATRASO
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

// GET: Obter acordos com parcelas em atraso
export async function GET(req: NextRequest) {
  try {
    await requirePermission("financial_view");
    
    const searchParams = req.nextUrl.searchParams;
    const daysOverdue = parseInt(searchParams.get('days') || '0');
    
    const overdueAgreements = await financialService.getOverdueAgreements(daysOverdue);
    return NextResponse.json(overdueAgreements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// POST: Enviar lembretes para acordos em atraso
export async function POST(req: NextRequest) {
  try {
    await requirePermission("financial_edit");
    
    const body = await req.json();
    const { agreementIds, messageTemplate, sendMethod } = body;
    
    if (!agreementIds || !Array.isArray(agreementIds) || agreementIds.length === 0) {
      return NextResponse.json(
        { error: "Lista de IDs de acordos é obrigatória." },
        { status: 400 }
      );
    }
    
    const result = await financialService.sendOverdueReminders(
      agreementIds, 
      messageTemplate, 
      sendMethod
    );
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}