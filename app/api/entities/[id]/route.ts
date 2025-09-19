// app/api/entities/[id]/route.ts - VERSÃO DE PRODUÇÃO
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
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar uma entidade
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("entities_edit");
    const body = await req.json();
    const updatedEntity = await entityService.updateEntity(params.id, body, user);
    return NextResponse.json(updatedEntity);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: error.errors },
        { status: 400 }
      );
    }
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir uma entidade
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission("entities_delete");
    const result = await entityService.deleteEntity(params.id, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}