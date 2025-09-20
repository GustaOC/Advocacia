// lib/with-rate-limit.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit as inMemoryRateLimit } from "@/lib/rate-limit"; // Implementação em memória
import { ratelimit as redisRateLimit } from "@/lib/rate-limit-redis"; // Nova implementação com Redis

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    const ip = req.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

    // Usa o rate limiter do Redis se estiver configurado (ambiente de produção)
    if (redisRateLimit && process.env.NODE_ENV === 'production') {
      const { success, limit, remaining, reset } = await redisRateLimit.limit(ip);
      
      if (!success) {
        const response = new NextResponse("Too Many Requests", { status: 429 });
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());
        return response;
      }
    } else {
      // Usa o rate limiter em memória para desenvolvimento local ou como fallback
      const { allowed } = inMemoryRateLimit(ip);
      if (!allowed) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
    }

    return handler(req);
  };
}