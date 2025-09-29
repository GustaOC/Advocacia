// app/api/cases/route.ts - VERSÃO COM PAGINAÇÃO
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import * as caseService from "@/lib/services/caseService";
import { CaseSchema } from "@/lib/schemas";
import { validateAndParseBody, apiError, apiSuccess } from "@/lib/api-helpers";
import { withRateLimit } from "@/lib/with-rate-limit";

// GET: Listar todos os casos com paginação
async function GET_handler(req: NextRequest) {
  try {
    await requirePermission("cases_view");
    
    // ==> PASSO 5: LENDO PARÂMETROS DE PAGINAÇÃO DA REQUISIÇÃO
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    // ==> FIM DO PASSO 5

    const { data, count } = await caseService.getCases(page, limit);
    
    // Retorna os dados e a contagem total para o frontend
    return apiSuccess({ cases: data, total: count });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return apiError("Acesso negado.", 403);
    }
    return apiError(error.message || "Erro interno do servidor.");
  }
}
export const GET = withRateLimit(GET_handler);

// POST: Criar um novo caso
async function POST_handler(req: NextRequest) {
  try {
    const user = await requirePermission("cases_create");
    
    const { data: body, error: validationError } = await validateAndParseBody(req, CaseSchema);
    if (validationError) {
      return validationError;
    }

    const newCase = await caseService.createCase(body, user);
    return apiSuccess(newCase, 201);
  } catch (error: any) {
    if (error.message.includes("Já existe")) {
      return apiError(error.message, 409);
    }
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return apiError("Acesso negado.", 403);
    }
    return apiError(error.message || "Erro interno do servidor.");
  }
}
export const POST = withRateLimit(POST_handler);