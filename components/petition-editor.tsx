// components/petition-editor.tsx - VERSÃO COMPLETA E CORRIGIDA

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Save,
  Share2,
  Download,
  PlusCircle,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import MonacoEditor from './MonacoEditor'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface Petition {
  id: string
  title: string
  content: string
  case_id: string
}

// O tipo 'Case' local agora permite 'case_number' ser nulo, espelhando a API
interface Case {
  id: number
  case_number: string | null
}

export function PetitionEditor() {
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null)
  const [newPetition, setNewPetition] = useState({
    title: '',
    case_id: '',
    content: 'Escreva sua petição aqui...',
  })
  const { toast } = useToast()

  const fetchPetitions = useCallback(async () => {
    try {
      const data = await apiClient.getPetitions()
      setPetitions(data)
      if (data.length > 0 && !selectedPetition) {
        setSelectedPetition(data[0])
      }
    } catch (error) {
      toast({
        title: 'Erro ao buscar petições',
        variant: 'destructive',
      })
    }
  }, [selectedPetition, toast])

  const fetchCases = useCallback(async () => {
    try {
      const response = await apiClient.getCases()
      setCases(response.cases)
    } catch (error) {
      toast({
        title: 'Erro ao buscar casos',
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchPetitions()
    fetchCases()
  }, [fetchPetitions, fetchCases])

  const handleSelectPetition = (petitionId: string) => {
    const petition = petitions.find((p) => p.id === petitionId)
    setSelectedPetition(petition || null)
  }

  const handleSavePetition = async () => {
    if (!selectedPetition) return
    try {
      // Usando a função correta que foi adicionada ao api-client
      await apiClient.updatePetition(selectedPetition.id, {
        content: selectedPetition.content,
        title: selectedPetition.title,
      })
      toast({
        title: 'Petição Salva!',
        description: 'Suas alterações foram salvas com sucesso.',
      })
      fetchPetitions()
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a petição.',
        variant: 'destructive',
      })
    }
  }

  const handleCreatePetition = async () => {
    if (!newPetition.title || !newPetition.case_id) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha o título e selecione um caso.',
        variant: 'destructive',
      })
      return
    }
    try {
      // Usando a função correta que foi adicionada ao api-client
      await apiClient.createPetition(newPetition)
      toast({
        title: 'Petição Criada!',
        description: 'A nova petição foi criada com sucesso.',
      })
      setNewPetition({
        title: '',
        case_id: '',
        content: 'Escreva sua petição aqui...',
      })
      // Fecha o Dialog de criação (se você tiver um estado para controlar a abertura)
      // E atualiza a lista de petições
      fetchPetitions()
    } catch (error) {
      toast({
        title: 'Erro ao Criar',
        description: 'Não foi possível criar a nova petição.',
        variant: 'destructive',
      })
    }
  }

  const handleContentChange = (value: string | undefined) => {
    if (selectedPetition) {
      setSelectedPetition({ ...selectedPetition, content: value || '' })
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <aside className="w-1/4 min-w-[250px] border-r p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="mr-2" />
          Minhas Petições
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full mb-4">
              <PlusCircle className="mr-2" /> Nova Petição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Petição</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Título da Petição"
                value={newPetition.title}
                onChange={(e) =>
                  setNewPetition({ ...newPetition, title: e.target.value })
                }
              />
              <Select
                value={newPetition.case_id}
                onValueChange={(value) =>
                  setNewPetition({ ...newPetition, case_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Caso" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.case_number || `Caso ID ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Conteúdo inicial (opcional)"
                value={newPetition.content}
                onChange={(e) =>
                  setNewPetition({ ...newPetition, content: e.target.value })
                }
              />
              <Button onClick={handleCreatePetition} className="w-full">
                Criar Petição
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex-grow overflow-y-auto">
          <ul>
            {petitions.map((petition) => (
              <li
                key={petition.id}
                className={`p-2 rounded-md cursor-pointer truncate ${
                  selectedPetition?.id === petition.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleSelectPetition(petition.id)}
              >
                {petition.title}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-4">
        {selectedPetition ? (
          <>
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <input
                type="text"
                value={selectedPetition.title}
                onChange={(e) =>
                  setSelectedPetition({
                    ...selectedPetition,
                    title: e.target.value,
                  })
                }
                className="text-2xl font-bold bg-transparent border-none focus:ring-0 w-full"
              />
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={handleSavePetition}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </div>
            </div>
            <div className="flex-grow h-full">
              {/* Passando as props corretas para o MonacoEditor corrigido */}
              <MonacoEditor
                value={selectedPetition.content}
                onChange={handleContentChange}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-muted-foreground">
            <p>Selecione uma petição para começar a editar ou crie uma nova.</p>
          </div>
        )}
      </main>
    </div>
  )
}