// app/api/petitions/route.ts - VERSÃO CORRIGIDA

import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import * as petitionService from "@/lib/services/petitionService";

// GET: Buscar todas as petições
export async function GET(request: Request) {
  try {
    const user = await requireAuth(); // Ou requirePermission("READ_PETITION") se necessário
    
    const url = new URL(request.url);
    const caseId = url.searchParams.get('case_id');
    const status = url.searchParams.get('status') as 'Em elaboração' | 'Revisão' | 'Protocolado' | null;

    let petitions;

    // Se foi fornecido case_id, busca petições do caso específico
    if (caseId) {
      // CORREÇÃO: A ordem dos argumentos foi trocada para (user, caseId)
      petitions = await petitionService.getPetitionsByCase(user, caseId);
    }
    // Se foi fornecido status, busca petições por status
    else if (status) {
      // CORREÇÃO: A ordem dos argumentos foi trocada para (user, status)
      petitions = await petitionService.getPetitionsByStatus(user, status);
    }
    // Senão, busca todas as petições
    else {
      petitions = await petitionService.getPetitions(user);
    }

    return NextResponse.json(petitions);
  } catch (error: any) {
    console.error("Erro ao buscar petições:", error.message);
    return NextResponse.json(
      { error: error.message === "UNAUTHORIZED" ? "Não autorizado" : "Erro interno do servidor" },
      { status: error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

// POST: Criar uma nova petição
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(); // Ou requirePermission("CREATE_PETITION") se necessário
    const body = await request.json();

    // CORREÇÃO: A ordem dos argumentos foi trocada para (user, body)
    const newPetition = await petitionService.createPetition(user, body);
    return NextResponse.json(newPetition, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro ao criar petição:", error.message);
    return NextResponse.json(
      { error: error.message === "FORBIDDEN" ? "Acesso negado" : 
               error.message === "UNAUTHORIZED" ? "Não autorizado" : 
               error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 
               error.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}