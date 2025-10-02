// vitest.config.ts — versão corrigida para evitar conflito de tipos do Vite
/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// ⚠️ Contexto do erro:
// O Vitest (1.x) usa tipos do Vite 5, enquanto alguns pacotes trazem tipos do Vite 7,
// causando o erro de “Plugin$1<any>[] não é atribuível a PluginOption”.
// A correção abaixo faz um *type cast* do plugin para `any` apenas neste arquivo
// de configuração, evitando o conflito sem impactar o runtime dos testes.

export default defineConfig({
  plugins: [react() as unknown as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
