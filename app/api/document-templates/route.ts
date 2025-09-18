// app/api/document-templates/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as templateService from "@/lib/services/templateService";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const templates = await templateService.getTemplates();
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const newTemplate = await templateService.createTemplate(body, user);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}