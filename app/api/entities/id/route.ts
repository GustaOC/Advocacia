// app/api/entities/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as entityService from "@/lib/services/entityService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter uma entidade específica
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("entities_view");
    const entity = await entityService.getEntityById(params.id);

    if (!entity) {
      return NextResponse.json({ error: "Entidade não encontrada." }, { status: 404 });
    }
    
    return NextResponse.json(entity);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// PUT: Atualizar uma entidade
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("entities_edit"); // Pega o usuário
    const body = await req.json();
    const updatedEntity = await entityService.updateEntity(params.id, body, user); // Passa o usuário
    return NextResponse.json(updatedEntity);
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

// DELETE: Excluir uma entidade
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("entities_delete"); // Pega o usuário
    const result = await entityService.deleteEntity(params.id, user); // Passa o usuário
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}