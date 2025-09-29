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
  "Status": z.enum(['Em andamento', 'Acordo', 'Extinto', 'Pago']).default('Em andamento'),
  "Prioridade": z.enum(['Alta', 'Média', 'Baixa']).default('Média'),
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
    const entityMap = new Map(allEntities.map(e => [e.name.toLowerCase(), e.id]));

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
    for (const [index, row] of data.entries()) {
      try {
        const validatedRow = ImportCaseSchema.parse(row);

        const clientId = entityMap.get(validatedRow.Cliente.toLowerCase());
        const executedId = entityMap.get(validatedRow.Executado.toLowerCase());

        if (!clientId) {
          throw new Error(`Cliente "${validatedRow.Cliente}" não encontrado no sistema. Cadastre-o primeiro.`);
        }
        if (!executedId) {
          throw new Error(`Executado "${validatedRow.Executado}" não encontrado no sistema. Cadastre-o primeiro.`);
        }

        const caseData = {
          client_entity_id: clientId,
          executed_entity_id: executedId,
          case_number: validatedRow["Numero Processo"],
          title: validatedRow.Observacao,
          status: validatedRow.Status,
          priority: validatedRow.Prioridade,
        };

        await caseService.createCase(caseData, user);
        successCount++;
      } catch (error: any) {
        errorCount++;
        const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => `Coluna '${e.path.join('.')}': ${e.message}`).join(', ') 
            : error.message;
        errors.push({ row: index + 2, error: errorMessage });
      }
    }

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