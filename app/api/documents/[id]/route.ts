// app/api/documents/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as documentService from "@/lib/services/documentService";

interface RouteParams {
  params: {
    id: string;
  };
}

// DELETE: Exclui um documento
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const result = await documentService.deleteDocument(Number(params.id));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "FORBIDDEN" ? 403 : 500 }
    );
  }
}