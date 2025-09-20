// vitest.setup.ts
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Limpa o DOM virtual após cada teste para evitar que testes afetem uns aos outros.
afterEach(() => {
  cleanup();
});