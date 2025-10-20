// app/api/cases/import/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as caseService from "@/lib/services/caseService";
import { getEntities } from "@/lib/services/entityService";
import { z } from "zod";
import * as XLSX from "xlsx";
import { withRateLimit } from "@/lib/with-rate-limit";

// Schema para validar cada linha da planilha
const ImportCaseSchema = z.object({
  "Cliente": z.string().min(2, "O nome do cliente é obrigatório."),
  "Executado": z.string().min(2, "O nome do executado é obrigatório."),
  "Numero Processo": z.string().optional().nullable(),
  "Observacao": z.string().min(3, "A observação (título) é obrigatória."),
  "Status": z.string().default('Em andamento'),
  "Prioridade": z.enum(['Alta', 'Média', 'Baixa']).default('Média'),
});

// Mapeamento de status da planilha para o schema do banco
function mapStatus(status: string): 'Em Andamento' | 'Finalizado' | 'Arquivado' | 'Suspenso' | 'Acordo' {
  const statusMap: Record<string, 'Em Andamento' | 'Finalizado' | 'Arquivado' | 'Suspenso' | 'Acordo'> = {
    'Em andamento': 'Em Andamento',
    'Pago': 'Finalizado',
    'QUITADO': 'Finalizado',
    'QUITAÇÃO': 'Finalizado',
    'Extinto': 'Arquivado',
    'EXTINTO': 'Arquivado',
    'Acordo': 'Acordo',
    'Suspenso': 'Suspenso',
  };
  return statusMap[status] || 'Em Andamento';
}

// --- Helpers de normalização e Schema tolerante para a planilha ---
const normalize = (s: unknown) =>
  (typeof s === 'string' ? s : '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const ImportRowSchema = z.object({
  Cliente: z.string().min(2),
  Executado: z.string().min(2),
  "Numero Processo": z.string().optional().nullable(),
  Observacao: z.string().min(3),
  Status: z.string().optional().nullable(),
  Prioridade: z.string().optional().nullable(),
});

async function POST_handler(req: NextRequest) {
  try {
    const user = await requirePermission("cases_create");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // 1. Buscar todas as entidades (clientes/executados) para mapeamento
    const allEntities = await getEntities();
    // Mapa robusto com e sem acentuação
    const entityMap = new Map<string, number>();
    for (const e of allEntities) {
      const n1 = (e.name || '').toLowerCase().trim();
      const n2 = (e.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (n1) entityMap.set(n1, e.id);
      if (n2) entityMap.set(n2, e.id);
    }

    // 2. Processar o arquivo com validação
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        return NextResponse.json({ error: "O arquivo Excel enviado não contém nenhuma planilha." }, { status: 400 });
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        return NextResponse.json({ error: `A planilha chamada '${sheetName}' não foi encontrada ou está vazia.` }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    // 3. Iterar sobre cada linha da planilha
    console.log(`[API Import Cases] Processando ${data.length} linhas do Excel`);
    for (const [index, row] of data.entries()) {
      try {
        // Pré-processa 'Prioridade' para contornar acentuação e variações
        const preRow: any = { ...row };
        if (typeof preRow['Prioridade'] === 'string') {
          const pr = preRow['Prioridade'].normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
          if (pr === 'media') preRow['Prioridade'] = 'MǸdia';
          if (pr === 'alta') preRow['Prioridade'] = 'Alta';
          if (pr === 'baixa') preRow['Prioridade'] = 'Baixa';
        }
        const validatedRow = ImportRowSchema.parse(preRow);

        const clientKey1 = validatedRow.Cliente.toLowerCase();
        const clientKey2 = validatedRow.Cliente.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const execKey1 = validatedRow.Executado.toLowerCase();
        const execKey2 = validatedRow.Executado.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const clientId = entityMap.get(clientKey1) ?? entityMap.get(clientKey2);
        const executedId = entityMap.get(execKey1) ?? entityMap.get(execKey2);

        if (!clientId) {
          throw new Error(`Cliente "${validatedRow.Cliente}" não encontrado no sistema. Cadastre-o primeiro.`);
        }
        if (!executedId) {
          throw new Error(`Executado "${validatedRow.Executado}" não encontrado no sistema. Cadastre-o primeiro.`);
        }

        const mappedStatus = mapStatus(validatedRow.Status);
        // Normaliza prioridade para valores aceitos pelo banco
        const prNorm = (validatedRow.Prioridade ?? '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        const mappedPriority = prNorm === 'alta' ? 'Alta' : prNorm === 'baixa' ? 'Baixa' : 'Média';
        console.log(`[API Import Cases] Status original: "${validatedRow.Status}", Status mapeado: "${mappedStatus}"`);

        const caseData = {
          client_entity_id: clientId,
          executed_entity_id: executedId,
          case_number: validatedRow["Numero Processo"],
          title: validatedRow.Observacao,
          debtor_id: String(executedId),
          creditor_id: String(clientId),
          status: mappedStatus,
        };

        console.log(`[API Import Cases] Criando caso ${index + 1}: ${caseData.title} com status "${caseData.status}"`);
        await caseService.createCase(caseData, user);
        successCount++;
        console.log(`[API Import Cases] Caso ${index + 1} criado com sucesso!`);
      } catch (error: any) {
        errorCount++;
        const errorMessage = error instanceof z.ZodError
            ? error.errors.map(e => `Coluna '${e.path.join('.')}': ${e.message}`).join(', ')
            : error.message;
        console.error(`[API Import Cases] Erro na linha ${index + 2}:`, errorMessage);
        errors.push({ row: index + 2, error: errorMessage });
      }
    }

    console.log(`[API Import Cases] Importação concluída: ${successCount} sucesso(s), ${errorCount} erro(s)`);

    return NextResponse.json({
      message: "Importação de casos concluída.",
      successCount,
      errorCount,
      errors,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API Import Cases] Erro:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: "Ocorreu um erro inesperado ao processar o arquivo." }, { status: 500 });
  }
}
export const POST = withRateLimit(POST_handler);


