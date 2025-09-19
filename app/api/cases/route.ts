// app/api/cases/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requirePermission } from "@/lib/auth"; // Adicionado getSessionUser
import * as caseService from "@/lib/services/caseService";

// GET: Listar todos os casos
export async function GET(req: NextRequest) {
  try {
    // Permissão ATIVADA: Apenas usuários com 'cases_view' podem listar os casos.
    await requirePermission("cases_view");
    const cases = await caseService.getCases();
    return NextResponse.json(cases);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar um novo caso
export async function POST(req: NextRequest) {
  try {
    // Permissão ATIVADA: Apenas usuários com 'cases_create' podem criar novos casos.
    // Também obtemos o usuário para registrar na auditoria (logAudit).
    const user = await requirePermission("cases_create");
    const body = await req.json();
    // Passando o usuário para o service, que irá registrar o log de auditoria.
    const newCase = await caseService.createCase(body, user);
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
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}