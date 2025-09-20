// Em: lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, hits } from './rate-limit'; // Importamos a função e o Map

describe('Rate Limiter', () => {
  // Antes de cada teste, limpamos o Map para garantir que os testes sejam independentes
  beforeEach(() => {
    hits.clear();
  });

  it('should allow a request under the limit', () => {
    const ip = '192.168.1.1';
    const result = rateLimit(ip, 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block a request exceeding the limit', () => {
    const ip = '192.168.1.2';
    const max = 3;
    
    // Simula 3 requisições
    rateLimit(ip, max);
    rateLimit(ip, max);
    rateLimit(ip, max);

    // A quarta requisição deve ser bloqueada
    const result = rateLimit(ip, max);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset the count after the window expires', async () => {
    const ip = '192.168.1.3';
    const windowMs = 100; // Janela de 100ms
    
    rateLimit(ip, 1, windowMs);
    const result1 = rateLimit(ip, 1, windowMs);
    expect(result1.allowed).toBe(false);

    // Aguarda o tempo da janela expirar
    await new Promise(resolve => setTimeout(resolve, windowMs + 10));

    const result2 = rateLimit(ip, 1, windowMs);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(0);
  });
});