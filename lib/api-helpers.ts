// lib/api-helpers.ts - Helpers para Validação e Respostas de API
import { ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

/**
 * Valida o corpo de uma requisição contra um schema Zod.
 * Retorna os dados validados ou uma resposta de erro padronizada.
 * @param req O objeto da requisição.
 * @param schema O schema Zod para validação.
 */
export async function validateAndParseBody<T>(req: Request, schema: ZodSchema<T>): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      // Se a validação falhar, lança um erro Zod que será capturado abaixo.
      throw parsed.error;
    }
    
    // Retorna os dados validados se tudo estiver correto.
    return { data: parsed.data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      // Se o erro for do Zod, retorna uma resposta 400 com os detalhes.
      return { 
        data: null, 
        error: NextResponse.json({ error: "Dados inválidos.", issues: error.flatten().fieldErrors }, { status: 400 }) 
      };
    }
    // Se o erro for de parsing (ex: JSON malformado), retorna um erro genérico.
    return { 
      data: null, 
      error: NextResponse.json({ error: "Corpo da requisição inválido ou malformado." }, { status: 400 }) 
    };
  }
}

/**
 * Cria uma resposta de sucesso padronizada para a API.
 * @param data Os dados a serem enviados na resposta.
 * @param status O código de status HTTP (padrão 200).
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Cria uma resposta de erro padronizada para a API.
 * @param message A mensagem de erro.
 * @param status O código de status HTTP (padrão 500).
 */
export function apiError(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}