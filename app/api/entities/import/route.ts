// app/api/entities/import/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as entityService from "@/lib/services/entityService";
import { z } from "zod";
import * as XLSX from "xlsx";

// Schema para validar cada linha da planilha
const ImportEntitySchema = z.object({
  Nome: z.string().min(2, "O nome é obrigatório."),
  Documento: z.string().optional().nullable(),
  Email: z.string().email("Email inválido.").optional().nullable(),
  Telefone: z.string().optional().nullable(),
  Endereco: z.string().optional().nullable(),
  Cidade: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("entities_create");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json({ error: "O arquivo enviado não contém planilhas." }, { status: 400 });
    }
    
    const sheet = workbook.Sheets[sheetName];

    // --- CORREÇÃO DEFINITIVA APLICADA AQUI ---
    // Verifica se o objeto da planilha é válido antes de usá-lo.
    if (!sheet) {
        return NextResponse.json({ error: `A planilha chamada '${sheetName}' não foi encontrada no arquivo.` }, { status: 400 });
    }
    // --- FIM DA CORREÇÃO ---

    const data = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    for (const [index, row] of data.entries()) {
      try {
        const validatedRow = ImportEntitySchema.parse(row);

        const entityData = {
          name: validatedRow.Nome,
          document: validatedRow.Documento,
          email: validatedRow.Email,
          phone: validatedRow.Telefone,
          address: validatedRow.Endereco,
          city: validatedRow.Cidade,
          type: 'Cliente',
        };

        await entityService.createEntity(entityData, user);
        successCount++;
      } catch (error: any) {
        errorCount++;
        if (error instanceof z.ZodError) {
          errors.push({ row: index + 2, error: error.errors.map(e => e.message).join(', ') });
        } else {
          errors.push({ row: index + 2, error: error.message });
        }
      }
    }

    return NextResponse.json({
      message: "Importação concluída.",
      successCount,
      errorCount,
      errors,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API Import] Erro:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ error: "Ocorreu um erro ao processar o arquivo." }, { status: 500 });
  }
}