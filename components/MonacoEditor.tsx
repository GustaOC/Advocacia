// components/MonacoEditor.tsx - VERSÃO COMPLETA E CORRIGIDA

"use client";

import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";

// O componente agora aceita propriedades (props) para ser reutilizável
interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
}

export default function MonacoEditor({
  value,
  onChange,
  language = "markdown", // Linguagem padrão é markdown
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Garante que um patch necessário para o Monaco Editor seja carregado
      require("../public/monaco-fix.js");

      if (editorRef.current && !editorInstance.current) {
        // Cria a instância do editor apenas uma vez
        const editor = monaco.editor.create(editorRef.current, {
          value: value, // Usa o valor inicial passado via props
          language: language,
          theme: "vs-dark",
          automaticLayout: true, // Garante que o editor se redimensione
          wordWrap: "on", // Habilita quebra de linha automática
        });

        // Adiciona um "ouvinte" para capturar as mudanças de conteúdo
        editor.onDidChangeModelContent(() => {
          // Quando o usuário digita, a função 'onChange' é chamada
          onChange(editor.getValue());
        });

        editorInstance.current = editor;
      }

      // Função de "limpeza" que é executada quando o componente é desmontado
      return () => {
        if (editorInstance.current) {
          editorInstance.current.dispose();
          editorInstance.current = null;
        }
      };
    }
  }, [language, onChange, value]);

  // Este efeito garante que, se o valor mudar por uma ação externa (ex: selecionar outra petição),
  // o conteúdo do editor seja atualizado.
  useEffect(() => {
    if (editorInstance.current && value !== editorInstance.current.getValue()) {
      editorInstance.current.setValue(value);
    }
  }, [value]);

  return <div ref={editorRef} style={{ height: "100%", width: "100%" }} />;
}