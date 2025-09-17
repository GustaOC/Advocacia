// app/api/cases/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as caseService from "@/lib/services/caseService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter um caso específico com suas partes
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("cases_view");
    const caseData = await caseService.getCaseById(params.id);

    if (!caseData) {
      return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
    }
    
    return NextResponse.json(caseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// PUT: Atualizar um caso
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        await requirePermission("cases_edit");
        const body = await req.json();
        const updatedCase = await caseService.updateCase(params.id, body);
        return NextResponse.json(updatedCase);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
        }
        return NextResponse.json(
          { error: error.message },
          { status: error.message === "FORBIDDEN" ? 403 : 500 }
        );
    }
}