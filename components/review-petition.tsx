"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Save, FileText, User, Calendar, Clock, Loader2, Eye, CheckCircle, AlertTriangle, XCircle, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReviewPetitionProps {
  petition: any
  onBack: () => void
  onSuccess: () => void
}

export function ReviewPetition({ petition, onBack, onSuccess }: ReviewPetitionProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reviewData, setReviewData] = useState({
    lawyer_notes: petition.lawyer_notes || "",
    final_verdict: petition.final_verdict || "",
  })

  const handleSaveReview = async () => {
    if (!reviewData.final_verdict) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione um veredito para continuar",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/petitions/${petition.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      })

      if (response.ok) {
        toast({
          title: "Revisão salva!",
          description: "A análise da petição foi salva com sucesso!",
        })
        onSuccess()
      } else {
        const { error } = await response.json()
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error saving review:", error)
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro inesperado ao salvar revisão",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: "Pendente", 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock
      },
      under_review: { 
        label: "Em Revisão", 
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Eye
      },
      approved: { 
        label: "Aprovado", 
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle
      },
      corrections_needed: { 
        label: "Correções Necessárias", 
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertTriangle
      },
      rejected: { 
        label: "Rejeitado", 
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.className} flex items-center space-x-2 px-3 py-1 text-sm`}>
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDeadlineBadge = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline)
    if (days < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Vencido ({Math.abs(days)} dias)</span>
        </Badge>
      )
    } else if (days <= 2) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{days} dias restantes</span>
        </Badge>
      )
    } else if (days <= 5) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{days} dias restantes</span>
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{days} dias restantes</span>
        </Badge>
      )
    }
  }

  const getVerdictPreview = () => {
    switch (reviewData.final_verdict) {
      case "approved"
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50 border-green-200",
          title: "Petição será aprovada",
          description: "A petição será marcada como aprovada e estará pronta para uso."
        }
      case "corrections_needed"
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
          title: "Correções necessárias",
          description: "A petição será retornada ao funcionário para correções."
        }
      case "rejected"
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 border-red-200",
          title: "Petição será rejeitada",
          description: "A petição será marcada como rejeitada e precisará ser refeita."
        }
      default
        return null
    }
  }

  const verdictPreview = getVerdictPreview()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="text-slate-700 border-slate-300 hover:bg-slate-50 px-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar à Lista
        </Button>
        <div className="flex items-center space-x-3">
          {getStatusBadge(petition.status)}
          {getDeadlineBadge(petition.deadline)}
        </div>
      </div>

      {/* Petition Details Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-slate-900 flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{petition.title}</h3>
              <p className="text-sm text-slate-600 font-normal">
                Revisão e análise da petição
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <span>Informações Básicas</span>
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                    <User className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Criado por:</p>
                      <p className="text-slate-700">{petition.created_by_employee.name}</p>
                      <p className="text-sm text-slate-500">{petition.created_by_employee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Prazo para revisão:</p>
                      <p className="text-slate-700">
                        {new Date(petition.deadline).toLocaleDateString("pt-BR", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-slate-500">
                        {Math.abs(getDaysUntilDeadline(petition.deadline))} dias
                        {getDaysUntilDeadline(petition.deadline) < 0 ? ' em atraso' : ' restantes'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Criado em:</p>
                      <p className="text-slate-700">
                        {new Date(petition.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(petition.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center space-x-2">
                  <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                  <span>Detalhes da Petição</span>
                </h4>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-900 mb-2">Descrição/Observações:</p>
                    <p className="text-green-800 leading-relaxed">
                      {petition.description || "Nenhuma observação específica fornecida"}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-900 mb-3">Arquivo:</p>
                    <Button 
                      variant="outline" 
                      className="text-blue-700 border-blue-300 hover:bg-blue-100 w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">{petition.file_name}</p>
                        <p className="text-xs text-blue-600">Clique para baixar</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="text-slate-900 flex items-center space-x-3">
            <div className="p-3 bg-purple-500 rounded-xl">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Análise e Veredito</h3>
              <p className="text-sm text-slate-600 font-normal">
                Forneça sua análise detalhada e veredito final
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Notes Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
              <Label htmlFor="lawyer_notes" className="text-lg font-semibold text-slate-900">
                Observações e Comentários
              </Label>
            </div>
            <Textarea
              id="lawyer_notes"
              value={reviewData.lawyer_notes}
              onChange={(e) => setReviewData((prev) => ({ ...prev, lawyer_notes: e.target.value }))}
              placeholder="Deixe suas observações detalhadas, sugestões de melhoria, pontos que precisam ser ajustados, elogios ao trabalho, etc. Seja específico para ajudar o funcionário a compreender suas orientações."
              rows={8}
              className="resize-none text-base leading-relaxed"
            />
            <p className="text-sm text-slate-500">
              Suas observações serão compartilhadas com o funcionário para orientar melhorias futuras
            </p>
          </div>

          {/* Verdict Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-6 bg-red-500 rounded-full"></div>
              <Label htmlFor="final_verdict" className="text-lg font-semibold text-slate-900">
                Veredito Final *
              </Label>
            </div>
            <Select
              value={reviewData.final_verdict}
              onValueChange={(value) => setReviewData((prev) => ({ ...prev, final_verdict: value }))}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione o veredito final da revisão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex items-center space-x-3 py-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Aprovado</p>
                      <p className="text-sm text-green-700">Petição está pronta para uso</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="corrections_needed">
                  <div className="flex items-center space-x-3 py-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">Correções Necessárias</p>
                      <p className="text-sm text-orange-700">Precisa de ajustes específicos</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center space-x-3 py-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Rejeitado</p>
                      <p className="text-sm text-red-700">Precisa ser refeito completamente</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Verdict Preview */}
            {verdictPreview && (
              <div className={`p-4 border rounded-lg ${verdictPreview.bg}`}>
                <div className="flex items-start space-x-3">
                  <verdictPreview.icon className={`h-5 w-5 ${verdictPreview.color} mt-0.5`} />
                  <div>
                    <p className={`font-semibold ${verdictPreview.color}`}>{verdictPreview.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{verdictPreview.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="px-6 h-11"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveReview} 
              disabled={loading || !reviewData.final_verdict} 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 h-11 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar Análise</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Reviews (if any) */}
      {petition.lawyer_notes && petition.final_verdict && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center space-x-3">
              <div className="p-3 bg-slate-500 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Análise Anterior</h3>
                <p className="text-sm text-slate-600 font-normal">
                  Revisão realizada anteriormente
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="p-6 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-900">Observações anteriores:</h4>
                  {getStatusBadge(petition.status)}
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {petition.lawyer_notes}
                </p>
              </div>
              
              <div className="text-sm text-slate-500 text-center">
                Esta análise pode ser atualizada com suas novas observações
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
