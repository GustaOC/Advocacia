import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth'

export async function GET() {
  try { // ✅ ADICIONADO Bloco try
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Esta linha pode lançar um erro se o usuário não tiver permissão
    await requirePermission('READ_EMPLOYEE');

    const supabase = createAdminClient();
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, email');

    if (error) {
      // Lança o erro para ser capturado pelo catch
      throw new Error(error.message);
    }
    return NextResponse.json(employees);

  } catch (error: any) { // ✅ ADICIONADO Bloco catch
    // Captura erros de permissão e outros erros
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado. Você não tem permissão para ver a equipe." }, { status: 403 });
    }
    // Retorna outros erros como erro de servidor
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}