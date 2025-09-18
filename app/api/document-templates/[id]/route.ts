// app/api/document-templates/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as templateService from "@/lib/services/templateService";
import { z } from "zod";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const template = await templateService.getTemplateById(Number(params.id));
    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const body = await req.json();
    const updatedTemplate = await templateService.updateTemplate(Number(params.id), body);
    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const result = await templateService.deleteTemplate(Number(params.id));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}