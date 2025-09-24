// app/api/entities/import/route.ts - VERSÃO ULTRA ROBUSTA E CORRIGIDA
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import * as entityService from "@/lib/services/entityService";
import { z } from "zod";
import * as XLSX from "xlsx";

// Schema mais flexível - todos os campos são opcionais exceto Nome Completo
const ImportEntitySchema = z.object({
  "Nome Completo": z.string().min(2, "O nome é obrigatório."),
  "Cpf": z.string().optional().nullable().or(z.literal("")),
  "Email": z.string().email("Email inválido.").optional().nullable().or(z.literal("")),
  "Endereço": z.string().optional().nullable().or(z.literal("")),
  "Nº": z.union([z.string(), z.number()]).optional().nullable(),
  "Bairro": z.string().optional().nullable().or(z.literal("")),
  "Cidade": z.string().optional().nullable().or(z.literal("")),
  "Cep": z.string().optional().nullable().or(z.literal("")),
  "Celular 1": z.union([z.string(), z.number()]).optional().nullable(),
  "Celular 2": z.union([z.string(), z.number()]).optional().nullable(),
}).passthrough(); // Permite campos extras não definidos

// Função para encontrar a planilha correta baseada nos cabeçalhos esperados
function findCorrectSheet(workbook: XLSX.WorkBook): { sheet: XLSX.WorkSheet; sheetName: string } | null {
  // Apenas Nome Completo é verdadeiramente obrigatório
  const requiredFields = ["Nome Completo"];
  // Campos que indicam que é uma planilha de entidades
  const entityIndicatorFields = ["Cpf", "CPF", "Endereço", "Celular 1", "Telefone", "Bairro", "Cidade"];
  
  console.log("[Import] Procurando planilha compatível...");
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || typeof sheet !== 'object') continue;
    
    try {
      const data = XLSX.utils.sheet_to_json(sheet);
      if (data.length === 0) continue;
      
      const firstRow = data[0] as Record<string, any>;
      const fields = Object.keys(firstRow);
      
      console.log(`[Import] Analisando planilha "${sheetName}", campos:`, fields);
      
      // Verificar se tem o campo obrigatório
      const hasRequiredFields = requiredFields.every(field => 
        fields.some(f => f.toLowerCase().includes(field.toLowerCase()))
      );
      
      // Verificar se tem pelo menos 2 campos que indicam ser uma planilha de entidades
      const matchingIndicators = entityIndicatorFields.filter(field => 
        fields.some(f => f.toLowerCase().includes(field.toLowerCase()))
      );
      
      if (hasRequiredFields && matchingIndicators.length >= 2) {
        console.log(`[Import] ✅ Planilha encontrada: "${sheetName}"`);
        return { sheet, sheetName };
      }
    } catch (error) {
      console.log(`[Import] Erro ao processar planilha "${sheetName}":`, error);
      continue;
    }
  }
  
  return null;
}

// Função para normalizar os dados da linha
function normalizeRowData(row: any): any {
  const normalized: any = {};
  
  // Mapear campos com variações de nomes
  const fieldMappings: Record<string, string[]> = {
    "Nome Completo": ["Nome Completo", "Nome", "Nome_Completo", "NomeCompleto"],
    "Cpf": ["Cpf", "CPF", "cpf", "Documento"],
    "Email": ["Email", "E-mail", "email", "EMAIL"],
    "Endereço": ["Endereço", "Endereco", "Endereço Completo", "Logradouro"],
    "Nº": ["Nº", "N°", "Número", "Numero", "N"],
    "Bairro": ["Bairro", "bairro", "BAIRRO"],
    "Cidade": ["Cidade", "cidade", "CIDADE", "Municipio"],
    "Cep": ["Cep", "CEP", "cep", "C.E.P."],
    "Celular 1": ["Celular 1", "Celular1", "Celular", "Telefone 1", "Tel1", "Fone1"],
    "Celular 2": ["Celular 2", "Celular2", "Telefone 2", "Tel2", "Fone2"],
  };
  
  // Primeiro, copiar todos os campos originais
  Object.keys(row).forEach(key => {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      normalized[key] = row[key];
    }
  });
  
  // Depois, mapear campos conhecidos
  for (const [targetField, possibleNames] of Object.entries(fieldMappings)) {
    for (const possibleName of possibleNames) {
      if (row[possibleName] !== undefined && row[possibleName] !== null && row[possibleName] !== "") {
        normalized[targetField] = row[possibleName];
        break;
      }
    }
    
    // Se o campo não foi encontrado, definir como null
    if (!(targetField in normalized)) {
      normalized[targetField] = null;
    }
  }
  
  // Converter números para strings onde necessário
  if (typeof normalized["Nº"] === "number") {
    normalized["Nº"] = normalized["Nº"].toString();
  }
  if (typeof normalized["Celular 1"] === "number") {
    normalized["Celular 1"] = normalized["Celular 1"].toString();
  }
  if (typeof normalized["Celular 2"] === "number") {
    normalized["Celular 2"] = normalized["Celular 2"].toString();
  }
  
  return normalized;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("entities_create");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("type") as string) || 'Cliente'; 

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    console.log(`[Import] Iniciando importação de ${entityType}s...`);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Procurar pela planilha correta
    const sheetInfo = findCorrectSheet(workbook);
    
    if (!sheetInfo) {
      // Se não encontrou, tentar com a primeira planilha como fallback
      const firstSheetName = workbook.SheetNames[0];
      
      // ✅ CORREÇÃO APLICADA AQUI: Adicionada verificação para garantir que firstSheetName não é undefined
      if (firstSheetName) { 
        const firstSheet = workbook.Sheets[firstSheetName];
        
        if (firstSheet) {
          console.log(`[Import] Usando primeira planilha como fallback: "${firstSheetName}"`);
          const data = XLSX.utils.sheet_to_json(firstSheet);
          
          if (data.length > 0) {
            const fields = Object.keys(data[0] as Record<string, any>);
            
            return NextResponse.json({ 
              error: "Formato de planilha não reconhecido.",
              details: `Campos encontrados: ${fields.join(", ")}. Campos esperados: Nome Completo, Cpf, Endereço, Nº, Bairro, Cidade, Cep, Celular 1, Celular 2, Email.`,
              suggestion: "Verifique se os nomes das colunas estão corretos (com acentos e espaços)."
            }, { status: 400 });
          }
        }
      }
      
      return NextResponse.json({ 
        error: "Nenhuma planilha válida encontrada no arquivo."
      }, { status: 400 });
    }
    
    const { sheet, sheetName } = sheetInfo;
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`[Import] Processando ${data.length} linhas da planilha "${sheetName}"`);

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];
    const processedCPFs = new Set<string>();

    for (const [index, row] of data.entries()) {
      try {
        // Normalizar os dados da linha
        const normalizedRow = normalizeRowData(row);
        
        // Log para debug
        if (index === 0) {
          console.log("[Import] Primeira linha normalizada:", normalizedRow);
        }
        
        // Validar com o schema flexível
        const validatedRow = ImportEntitySchema.parse(normalizedRow);
        
        // Verificar duplicação de CPF na mesma importação
        if (validatedRow.Cpf && processedCPFs.has(validatedRow.Cpf)) {
          throw new Error(`CPF ${validatedRow.Cpf} duplicado na planilha`);
        }
        if (validatedRow.Cpf) {
          processedCPFs.add(validatedRow.Cpf);
        }

        const entityData = {
          name: validatedRow["Nome Completo"],
          document: validatedRow.Cpf || null,
          email: validatedRow.Email || null,
          address: validatedRow.Endereço || null,
          address_number: validatedRow["Nº"] ? String(validatedRow["Nº"]) : null,
          neighborhood: validatedRow.Bairro || null,
          city: validatedRow.Cidade || null,
          zip_code: validatedRow.Cep || null,
          phone: validatedRow["Celular 1"] ? String(validatedRow["Celular 1"]) : null,
          phone2: validatedRow["Celular 2"] ? String(validatedRow["Celular 2"]) : null,
          type: entityType,
        };

        await entityService.createEntity(entityData, user);
        successCount++;
        console.log(`[Import] ✅ Linha ${index + 2}: ${entityData.name} importado com sucesso`);
        
      } catch (error: any) {
        errorCount++;
        let errorMessage = error.message;
        
        if (error instanceof z.ZodError) {
          errorMessage = error.errors.map(e => {
            return `${e.message}`;
          }).join(', ');
        }
        
        // Melhorar mensagens de erro
        if (errorMessage.includes("Já existe uma entidade")) {
          const rowData = normalizeRowData(row);
          errorMessage = `Já existe uma entidade com CPF "${rowData.Cpf || 'não informado'}" ou email "${rowData.Email || 'não informado'}"`;
        }
        
        errors.push({ 
          row: index + 2, 
          error: errorMessage.substring(0, 200) // Limitar tamanho da mensagem
        });
        
        console.log(`[Import] ❌ Linha ${index + 2}: ${errorMessage}`);
      }
    }

    const response = {
      message: `Importação de ${entityType}s concluída!`,
      planilhaUsada: sheetName,
      successCount,
      errorCount,
      errors: errors.slice(0, 20), // Mostrar apenas os primeiros 20 erros
      totalErrors: errors.length,
      summary: {
        total: data.length,
        sucesso: successCount,
        falha: errorCount,
        taxa_sucesso: data.length > 0 ? `${Math.round((successCount / data.length) * 100)}%` : '0%'
      }
    };
    
    console.log(`[Import] Resultado final: ${successCount} sucessos, ${errorCount} erros`);

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("[API Import] Erro geral:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ 
      error: "Erro ao processar o arquivo. Verifique se o formato está correto.",
      details: error.message 
    }, { status: 500 });
  }
}