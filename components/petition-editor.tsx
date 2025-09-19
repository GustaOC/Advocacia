"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { ArrowLeft, Save, Send } from "lucide-react"

// Simulação de um editor de texto rico. Em um projeto real,
// usaríamos uma biblioteca como Tiptap, Quill.js ou Slate.js.
// Por simplicidade, usaremos uma <textarea> estilizada.
const RichTextEditor = ({ value, onChange }: { value: string, onChange: (content: string) => void }) => {
  return (
    <div className="border rounded-md">
      <div className="p-2 border-b bg-muted/50 flex space-x-2">
        {/* Barra de Ferramentas Simulada */}
        <Button variant="outline" size="sm">B</Button>
        <Button variant="outline" size="sm">I</Button>
        <Button variant="outline" size="sm">U</Button>
      </div>
      <textarea
        className="w-full h-96 p-4 focus:outline-none resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Comece a escrever sua petição aqui..."
      />
    </div>
  )
}

interface PetitionEditorProps {
  petition: any | null
  onBack: () => void
}

export function PetitionEditor({ petition, onBack }: PetitionEditorProps) {
  const [title, setTitle] = useState(petition?.title || "")
  const [content, setContent] = useState(petition?.content || "")
  const [responsible, setResponsible] = useState(petition?.assigned_to_employee_id || "")

  const handleSave = () => {
    // Lógica para salvar a petição (chamada de API)
    console.log("Salvando:", { title, content, responsible })
    alert("Petição salva com sucesso! (simulação)")
  }

  const handleSendForReview = () => {
    // Lógica para enviar para revisão
    console.log("Enviando para revisão:", { title, content, responsible })
    alert("Petição enviada para revisão! (simulação)")
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a Lista
                </Button>
                <CardTitle>{petition ? "Editar Petição" : "Nova Petição"}</CardTitle>
                <CardDescription>
                    {petition ? `Editando o documento "${petition.title}"` : "Crie um novo documento para um caso."}
                </CardDescription>
            </div>
            <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Rascunho
                </Button>
                <Button onClick={handleSendForReview}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Correção
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="title">Título do Documento</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Petição Inicial - Revisão de Benefício" />
            </div>
            <div>
                <Label htmlFor="responsible">Responsável pela Correção</Label>
                {/* Em uma implementação real, isto seria um Select com os funcionários */}
                <Input id="responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Selecione o advogado" />
            </div>
        </div>
        <div className="flex-grow">
          <RichTextEditor value={content} onChange={setContent} />
        </div>
      </CardContent>
    </Card>
  )
}