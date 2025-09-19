// app/api/entities/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission, requireAuth } from "@/lib/auth"; // Importar requireAuth
import * as entityService from "@/lib/services/entityService";

// GET: Listar todas as entidades
export async function GET(req: NextRequest) {
  try {
    await requirePermission("entities_view");
    const entities = await entityService.getEntities();
    return NextResponse.json(entities);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar uma nova entidade
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("entities_create"); // Pega o usuário
    const body = await req.json();
    const newEntity = await entityService.createEntity(body, user); // Passa o usuário para o serviço
    return NextResponse.json(newEntity, { status: 201 });
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