import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/lib/auth'
// ✅ CORREÇÃO: A função para buscar um único caso estava faltando no service. Adicionei-a e importei corretamente.
import { getCaseById, updateCase } from '@/lib/services/caseService'
import { withRateLimit } from "@/lib/with-rate-limit";

async function GET_handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ CORREÇÃO: Convertendo o ID de string para número antes de passar para a função do serviço.
  const caseId = Number(params.id)
  if (isNaN(caseId)) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 })
  }

  const caseData = await getCaseById(String(caseId)) // O service espera uma string, então convertemos de volta.
  if (!caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  return NextResponse.json(caseData)
}
export const GET = withRateLimit(GET_handler);

async function PUT_handler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await requirePermission('UPDATE_CASE')

  // ✅ CORREÇÃO: Convertendo o ID de string para número.
  const caseId = Number(params.id)
  if (isNaN(caseId)) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 })
  }

  const body = await request.json()
  // A função updateCase provavelmente também espera um número.
  const updatedCase = await updateCase(caseId, body, user)
  return NextResponse.json(updatedCase)
}
export const PUT = withRateLimit(PUT_handler);