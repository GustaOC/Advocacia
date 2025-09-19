// app/api/petitions/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as petitionService from "@/lib/services/petitionService";

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT: Atualizar uma petição (ex: mudar status ou responsável)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // await requirePermission("petitions_edit");
    const body = await req.json();
    const updatedPetition = await petitionService.updatePetition(params.id, body);
    return NextResponse.json(updatedPetition);
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