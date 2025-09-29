// app/api/cases/[id]/history/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as caseService from "@/lib/services/caseService";
import { withRateLimit } from "@/lib/with-rate-limit";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Obter o histórico de um caso específico
async function GET_handler(req: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission("cases_view");
    const caseId = Number(params.id);

    if (isNaN(caseId)) {
        return NextResponse.json({ error: "ID do caso inválido." }, { status: 400 });
    }

    const history = await caseService.getCaseHistory(caseId);

    return NextResponse.json(history);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export const GET = withRateLimit(GET_handler);