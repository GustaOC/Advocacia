// app/api/entities/import/route.ts - VERSÃO COM NOVOS CAMPOS
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as entityService from "@/lib/services/entityService";
import { z } from "zod";
import * as XLSX from "xlsx";

// Schema para validar cada linha da planilha, agora com os novos campos
const ImportEntitySchema = z.object({
  "Nome Completo": z.string().min(2, "O nome é obrigatório."),
  "Cpf": z.string().optional().nullable(),
  "Email": z.string().email("Email inválido.").optional().nullable(),
  "Endereço": z.string().optional().nullable(),
  "Nº": z.string().or(z.number()).optional().nullable(),
  "Bairro": z.string().optional().nullable(),
  "Cidade": z.string().optional().nullable(),
  "Cep": z.string().optional().nullable(),
  "Celular 1": z.string().optional().nullable(),
  "Celular 2": z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("entities_create");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("type") as string) || 'Cliente'; 

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
    if (!sheet) {
        return NextResponse.json({ error: `A planilha '${sheetName}' não foi encontrada.` }, { status: 400 });
    }
    const data = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    for (const [index, row] of data.entries()) {
      try {
        const validatedRow = ImportEntitySchema.parse(row);

        const entityData = {
          name: validatedRow["Nome Completo"],
          document: validatedRow.Cpf,
          email: validatedRow.Email,
          address: validatedRow.Endereço,
          address_number: String(validatedRow["Nº"] || ''), // Garante que seja string
          neighborhood: validatedRow.Bairro,
          city: validatedRow.Cidade,
          zip_code: validatedRow.Cep,
          phone: validatedRow["Celular 1"],
          phone2: validatedRow["Celular 2"],
          type: entityType, 
        };

        await entityService.createEntity(entityData, user);
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