// app/api/clients/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as clientService from "@/lib/services/clientService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter um cliente específico
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("clients_view");
    const client = await clientService.getClientById(params.id);

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    
    return NextResponse.json(client);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// PUT: Atualizar um cliente
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("clients_edit");
    const body = await req.json();
    const updatedClient = await clientService.updateClient(params.id, body, user);
    return NextResponse.json(updatedClient);
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

// DELETE: Excluir um cliente
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("clients_delete");
    const result = await clientService.deleteClient(params.id, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}