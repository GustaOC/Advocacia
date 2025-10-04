// app/api/auth/update-password/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
// CORREÇÃO: Mantendo a consistência com o resto do projeto.
import { createAdminClient } from '@/lib/supabase/server' 
import { withRateLimit } from '@/lib/with-rate-limit'

// CORREÇÃO: Garantindo que a rota seja sempre dinâmica.
export const dynamic = 'force-dynamic'

/**
 * Atualiza a senha de um usuário usando o Admin SDK do Supabase.
 * Suporta identificar o usuário por email OU por user_id.
 */
const BodySchema = z
  .object({
    email: z.string().email().optional(),
    user_id: z.string().optional(),
    new_password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  })
  .refine((data) => data.email || data.user_id, {
    message: "Informe 'email' ou 'user_id'.",
    path: ['email'],
  })

async function POST_handler(req: NextRequest): Promise<NextResponse> {
  try {
    const json = await req.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: issue?.message || 'Dados inválidos',
          details: parsed.error.format(),
        },
        { status: 400 },
      )
    }

    const { email, user_id, new_password } = parsed.data
    const supabase = createAdminClient() // CORREÇÃO: Usando o nome de função consistente

    // Descobre o ID do usuário (por email ou já fornecido)
    let targetUserId: string | undefined = user_id

    if (!targetUserId && email) {
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      const found = data.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      )
      if (!found) {
        return NextResponse.json(
          { error: 'Usuário não encontrado pelo email informado.' },
          { status: 404 },
        )
      }
      targetUserId = found.id
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário.' },
        { status: 400 },
      )
    }

    const { data: updateData, error: updateError } =
      await supabase.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso.',
      user: {
        id: updateData?.user?.id ?? targetUserId,
        email: updateData?.user?.email,
      },
    })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as any).name === 'ZodError'
    ) {
      const ze = err as z.ZodError
      const issue = ze.issues[0]
      return NextResponse.json(
        {
          error: issue?.message || 'Dados inválidos',
          details: ze.format(),
        },
        { status: 400 },
      )
    }

    const message =
      err instanceof Error ? err.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = withRateLimit(POST_handler)