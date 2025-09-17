// app/api/documents/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import * as documentService from "@/lib/services/documentService";
import { DocumentUploadSchema } from "@/lib/schemas";

// GET: Lista os documentos de um caso específico
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("case_id");

    if (!caseId) {
      return NextResponse.json({ error: "O parâmetro case_id é obrigatório." }, { status: 400 });
    }

    const documents = await documentService.getDocumentsByCaseId(Number(caseId));
    return NextResponse.json(documents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}

// POST: Lida com o upload de um novo documento
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const case_id = formData.get("case_id");
    const description = formData.get("description");

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const parsedDetails = DocumentUploadSchema.parse({ case_id, description });
    
    const newDocument = await documentService.uploadDocument(
      file,
      { case_id: parsedDetails.case_id, description: parsedDetails.description },
      user
    );

    return NextResponse.json(newDocument, { status: 201 });
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