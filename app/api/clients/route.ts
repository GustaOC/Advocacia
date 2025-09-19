// app/api/clients/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as clientService from "@/lib/services/clientService";

// GET: Listar todos os clientes
export async function GET(req: NextRequest) {
  try {
    // Permissão ATIVADA
    await requirePermission("clients_view"); 
    const clients = await clientService.getClients();
    return NextResponse.json(clients);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar um novo cliente
export async function POST(req: NextRequest) {
  try {
    // Permissão ATIVADA e usuário obtido para auditoria
    const user = await requirePermission("clients_create"); 
    const body = await req.json();
    const newClient = await clientService.createClient(body, user);
    return NextResponse.json(newClient, { status: 201 });
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