// app/api/petitions/route.ts - VERSÃO CORRIGIDA E SEGURA

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getPetitions } from "@/lib/services/petitionService";

export async function GET(request: Request) {
  try {
    // CORREÇÃO: Padronizando o nome da permissão para 'petitions_view'
    // e garantindo que a verificação de permissão esteja ativa.
    const user = await requirePermission("petitions_view");
    const petitions = await getPetitions(user);
    return NextResponse.json(petitions);
  } catch (error: any) {
    console.error("Erro ao buscar petições:", error.message);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// O método POST pode ser implementado aqui no futuro
// export async function POST(request: Request) { ... }