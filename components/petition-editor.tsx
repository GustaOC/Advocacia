"use client"

// ✅ CORREÇÃO: O ícone 'Case' não existe. Substituído por 'Gavel' (martelo de juiz)
// e 'FileText' (ícone de documento), que são mais apropriados e existem na biblioteca.
import { Gavel, FileText } from 'lucide-react'

export function PetitionEditor() {
  // Você pode usar o ícone que fizer mais sentido no seu contexto.
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="flex items-center text-lg font-semibold mb-4">
        <FileText className="mr-2 h-5 w-5" />
        Editor de Petição
      </h2>
      {/* Restante do seu componente do editor aqui... */}
      <p>Área de edição da petição.</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
        <Gavel className="mr-2 h-4 w-4" />
        Finalizar Petição
      </button>
    </div>
  )
}