// lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Inicializa o cliente Redis apenas se as variáveis de ambiente estiverem presentes.
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Configura o rate limiter para permitir 10 requisições a cada 10 segundos.
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
} else {
  console.warn("Variáveis de ambiente do Upstash Redis não configuradas. O rate limiter persistente está desativado.");
}

export { ratelimit };