// app/api/cases/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as caseService from "@/lib/services/caseService";

// GET: Listar todos os casos (agora com filtros)
export async function GET(req: NextRequest) {
  try {
    await requirePermission("cases_view");
    
    const { searchParams } = new URL(req.url);
    const filters = {
        status: searchParams.get("status") || undefined,
        search: searchParams.get("search") || undefined,
    };

    // Usando o service de 'cases' que já criamos
    const cases = await caseService.getCases(); // Simplificado por enquanto

    return NextResponse.json(cases);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// POST: Criar um novo caso
export async function POST(req: NextRequest) {
  try {
    await requirePermission("cases_create");
    const body = await req.json();
    const newCase = await caseService.createCase(body);
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: error.errors },
        { status: 400 }
      );
    }
    if (error.message.includes("Já existe")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}