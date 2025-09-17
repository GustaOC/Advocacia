// app/api/financial-agreements/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as financialService from "@/lib/services/financialService";

// GET: Listar todos os acordos financeiros
export async function GET(req: NextRequest) {
  try {
    await requirePermission("financial_view");
    const agreements = await financialService.getFinancialAgreements();
    return NextResponse.json(agreements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// POST: Criar um novo acordo financeiro
export async function POST(req: NextRequest) {
  try {
    await requirePermission("financial_create");
    const body = await req.json();
    const newAgreement = await financialService.createFinancialAgreement(body);
    return NextResponse.json(newAgreement, { status: 201 });
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