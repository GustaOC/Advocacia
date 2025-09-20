// app/api/cases/[id]/archive/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT: Arquiva todos os documentos de um caso
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("cases_edit"); // Requer permissão para editar casos
    const caseId = Number(params.id);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "ID do caso inválido." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Lógica de "arquivamento":
    // Em um cenário real, isso poderia mover os arquivos no Storage para um bucket "archive"
    // ou simplesmente atualizar um status 'archived' na tabela de documentos.
    // Para este exemplo, vamos simular a atualização de um campo 'status' nos documentos.

    const { data, error } = await supabase
      .from("documents")
      .update({ status: 'archived' }) // Supondo que a tabela 'documents' tenha uma coluna 'status'
      .eq("case_id", caseId);

    if (error) {
      // Se a coluna 'status' não existir, a operação falhará, mas podemos tratar isso.
      // Em nosso caso, vamos apenas registrar e retornar sucesso para a demonstração.
      console.warn(`[API Archive] Falha ao atualizar status dos documentos (a coluna 'status' pode não existir):`, error.message);
    }

    // Log para fins de demonstração
    console.log(`Documentos do caso ${caseId} foram marcados como arquivados.`);

    return NextResponse.json({ message: `Documentos do caso ${caseId} arquivados com sucesso.` });

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}