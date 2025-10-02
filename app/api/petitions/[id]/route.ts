// app/api/petitions/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission, requireAuth } from "@/lib/auth";
import * as petitionService from "@/lib/services/petitionService";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Buscar uma petição específica
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(); // Ou requirePermission("READ_PETITION") se necessário

    // CORREÇÃO: A ordem dos parâmetros foi invertida para (user, id) e o id é passado como string.
    const petition = await petitionService.getPetitionById(user, params.id);
    
    if (!petition) {
      return NextResponse.json(
        { error: "Petição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(petition);
  } catch (error: any) {
    console.error("Erro ao buscar petição:", error.message);
    return NextResponse.json(
      { error: error.message === "UNAUTHORIZED" ? "Não autorizado" : "Erro interno do servidor" },
      { status: error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

// PUT: Atualizar uma petição (ex: mudar status ou responsável)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(); // Ou requirePermission("UPDATE_PETITION") se necessário
    const body = await req.json();
    
    const updatedPetition = await petitionService.updatePetition(params.id, body, user);
    return NextResponse.json(updatedPetition);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Erro ao atualizar petição:", error.message);
    return NextResponse.json(
      { error: error.message === "FORBIDDEN" ? "Acesso negado" : 
               error.message === "UNAUTHORIZED" ? "Não autorizado" : 
               error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 
               error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

// DELETE: Deletar uma petição
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(); // Ou requirePermission("DELETE_PETITION") se necessário
    
    const result = await petitionService.deletePetition(params.id, user);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao deletar petição:", error.message);
    return NextResponse.json(
      { error: error.message === "FORBIDDEN" ? "Acesso negado" : 
               error.message === "UNAUTHORIZED" ? "Não autorizado" : 
               error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 
               error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}