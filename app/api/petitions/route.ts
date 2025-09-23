// app/api/petitions/route.ts 

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
// ✅ CORREÇÃO: Removida a importação de 'createPetition' que não existe no serviço,
// e importado 'getPetitions' que é a função correta para o método GET.
import { getPetitions } from "@/lib/services/petitionService";

export async function GET(request: Request) {
  try {
    const user = await requirePermission("READ_PETITION");
    const petitions = await getPetitions(user);
    return NextResponse.json(petitions);
  } catch (error: any) {
    console.error("Erro ao buscar petições:", error.message);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// O método POST pode ser implementado aqui no futuro
// export async function POST(request: Request) { ... }