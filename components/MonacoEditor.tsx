"use client";

import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";

export default function MonacoEditor() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Garante que o fix seja carregado
      require("../public/monaco-fix.js");

      if (editorRef.current) {
        const editor = monaco.editor.create(editorRef.current, {
          value: "// Digite seu código aqui...",
          language: "javascript",
          theme: "vs-dark",
          automaticLayout: true,
        });

        return () => editor.dispose();
      }
    }
  }, []);

  return <div ref={editorRef} style={{ height: "500px", width: "100%" }} />;
}
