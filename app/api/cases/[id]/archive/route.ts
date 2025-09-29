// app/api/cases/[id]/archive/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

interface RouteParams {
  params: {
    id: string;
  };
}

// Handler para arquivar os documentos de um caso
async function archiveHandler(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("cases_edit"); // Requer permissão para editar casos
    const caseId = Number(params.id);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: "ID do caso inválido." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Lógica de "arquivamento":
    // Atualiza o status dos documentos relacionados ao caso para 'archived'.
    const { data, error } = await supabase
      .from("documents")
      .update({ status: 'archived' }) // Assumindo que a tabela 'documents' tem uma coluna 'status'
      .eq("case_id", caseId);

    if (error) {
      console.error(`[API Archive] Falha ao atualizar status dos documentos:`, error.message);
      // É uma boa prática lançar o erro para ser capturado pelo bloco catch geral.
      throw new Error("Não foi possível arquivar os documentos. Verifique a estrutura da tabela.");
    }

    console.log(`Documentos do caso ${caseId} foram marcados como arquivados.`);

    return NextResponse.json({ message: `Documentos do caso ${caseId} arquivados com sucesso.` });

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Exporta o handler da rota já com o rate limit aplicado
export const PUT = withRateLimit(archiveHandler);