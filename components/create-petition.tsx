"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Send, Loader2, Upload, AlertTriangle, CheckCircle, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreatePetitionProps {
  onSuccess: () => void
}

export function CreatePetition({ onSuccess }: CreatePetitionProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    assigned_to: "",
    created_by: "1", // Mock current user ID
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Mock lawyers list - in real app, fetch from API
  const lawyers = [
    { id: "1", name: "Dr. Cássio Miguel" },
    { id: "2", name: "Dr. João Silva" },
    { id: "3", name: "Dra. Maria Santos" },
    { id: "4", name: "Dr. Pedro Oliveira" },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    // Validate file type (Word documents)
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo Word (.doc ou .docx)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    toast({
      title: "Arquivo selecionado",
      description: `${file.name} foi adicionado com sucesso`,
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.deadline || !formData.assigned_to || !selectedFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("description", formData.description)
      submitData.append("deadline", formData.deadline)
      submitData.append("assigned_to", formData.assigned_to)
      submitData.append("created_by", formData.created_by)
      submitData.append("file", selectedFile)

      const response = await fetch("/api/petitions", {
        method: "POST",
        body: submitData,
      })

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Petição enviada para revisão com sucesso!",
        })
        // Reset form
        setFormData({
          title: "",
          description: "",
          deadline: "",
          assigned_to: "",
          created_by: "1",
        })
        setSelectedFile(null)
        onSuccess()
      } else {
        const { error } = await response.json()
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error creating petition:", error)
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Erro inesperado ao enviar petição",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-xl">
              <FileUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Nova Petição para Revisão</h3>
              <p className="text-sm text-slate-600 font-normal">
                Envie sua petição para análise e aprovação do advogado responsável
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Form Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-slate-900">Informações Básicas</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Título da Petição *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Petição Inicial - Processo XYZ"
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Use um título descritivo que identifique claramente a petição
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="deadline" className="text-sm font-medium text-slate-700">
                    Prazo para Revisão *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Data limite para a revisão da petição
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="assigned_to" className="text-sm font-medium text-slate-700">
                  Advogado Responsável *
                </Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="h-11">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder="Selecione o advogado responsável" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {lawyers.map((lawyer) => (
                      <SelectItem key={lawyer.id} value={lawyer.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{lawyer.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Advogado que será responsável pela revisão desta petição
                </p>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-slate-900">Descrição e Observações</h4>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Instruções Específicas
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva instruções específicas, pontos importantes a revisar, urgência, contexto do processo, etc."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-slate-500">
                  Forneça o máximo de contexto possível para facilitar a revisão
                </p>
              </div>
            </div>

            {/* Upload de Arquivo */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-slate-900">Arquivo da Petição</h4>
              </div>

              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragOver
                      ? 'border-blue-400 bg-blue-50'
                      : selectedFile
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    id="file"
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remover arquivo
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="file" className="cursor-pointer space-y-4 block">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-900">
                          Clique para selecionar ou arraste o arquivo
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          Formatos aceitos: .doc, .docx (máximo 10MB)
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Requisitos do arquivo */}
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <h5 className="font-medium text-amber-800">Requisitos do Arquivo</h5>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Arquivo deve estar em formato Word (.doc ou .docx)</li>
                          <li>• Tamanho máximo de 10MB</li>
                          <li>• Certifique-se de que o arquivo não está corrompido</li>
                          <li>• Recomenda-se revisão ortográfica antes do envio</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-slate-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onSuccess()}
                className="px-6 h-11"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 h-11 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Enviar Petição</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
