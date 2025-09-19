// app/api/cases/[id]/route.ts
import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/lib/auth'
import { getCaseById, updateCase } from '@/lib/services/caseService'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Permissão para visualizar um caso específico
    await requirePermission("cases_view");

    const caseId = Number(params.id);
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'ID do caso é inválido' }, { status: 400 });
    }

    const caseData = await getCaseById(caseId, user);
    if (!caseData) {
      return NextResponse.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    return NextResponse.json(caseData);
  } catch (error: any) {
     if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Permissão para editar um caso
    await requirePermission('cases_edit');

    const caseId = Number(params.id);
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'ID do caso é inválido' }, { status: 400 });
    }

    const body = await request.json();
    const updatedCase = await updateCase(caseId, body, user);
    return NextResponse.json(updatedCase);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}