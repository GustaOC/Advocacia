// app/api/financial-agreements/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter um acordo financeiro específico
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