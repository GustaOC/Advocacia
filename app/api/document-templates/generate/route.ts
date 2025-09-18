// app/api/document-templates/generate/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as templateService from "@/lib/services/templateService";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    
    // Valida a requisição usando o schema
    const { templateId, caseId } = templateService.GenerateDocumentSchema.parse(body);

    const result = await templateService.generateDocument(templateId, caseId);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}