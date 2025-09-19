// app/api/publications/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as publicationService from "@/lib/services/publicationService";

// GET: Listar todas as publicações
export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("publications_view"); 
    const publications = await publicationService.getPublications(user);
    return NextResponse.json(publications);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}