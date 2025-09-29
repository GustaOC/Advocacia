// app/api/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { getDocumentsByCaseId, createDocument } from "@/lib/services/documentService";

/** GET: lista documentos por case_id */
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const url = new URL(req.url);
    const caseIdParam = url.searchParams.get("case_id");
    const caseId = Number(caseIdParam);

    if (!caseId || Number.isNaN(caseId)) {
      return NextResponse.json({ error: "Parâmetro 'case_id' inválido." }, { status: 400 });
    }

    const documents = await getDocumentsByCaseId(caseId);
    return NextResponse.json({ data: { documents, total: documents.length } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao listar documentos.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

/** POST: cria um registro em `documents` (metadados/URL já devem vir do front ou de upload prévio) */
const BodySchema = z.object({
  case_id: z.coerce.number(),
}).passthrough();

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(); // garante autenticação
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const doc = await createDocument(parsed);
    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao criar documento.", details: err?.message ?? String(err) },
      { status: 400 }
    );
  }
}
