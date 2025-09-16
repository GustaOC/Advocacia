"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import {
  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  FileText,
  X,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Phone,
  Mail,
  MapPin,
  FileUser,
  Settings,
  FileUp,
  LayoutGrid
} from "lucide-react"

import { type Client } from "@/lib/supabase"
import { apiClient } from "@/lib/api-client"

// API helpers
async function apiGetClients(params?: { search?: string; status?: string; limit?: number }) {
  try {
    return await apiClient.getClients()
  } catch (error) {
    console.error("Error fetching clients:", error)
    throw error
  }
}

async function apiCreateClient(payload: Partial<Client> & Record<string, any>) {
  try {
    return await apiClient.createClient(payload)
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

async function apiUpdateClient(id: number, payload: Partial<Client> & Record<string, any>) {
  try {
    return await apiClient.updateClient(id.toString(), payload)
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

async function apiDeleteClient(id: number) {
  try {
    return await apiClient.deleteClient(id.toString())
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

async function checkApiConnection() {
  try {
    const isConnected = await apiClient.isAuthenticated()
    if (isConnected) {
      return { success: true, message: "Conectado", details: "API funcionando corretamente" }
    } else {
      return { success: false, message: "Não autenticado", details: "Sessão expirada" }
    }
  } catch (error: any) {
    return { success: false, message: String(error), details: error?.message || "" }
  }
}

/* Normalização de cabeçalhos */

/** Remove acentos (sem depender de libs externas) */
function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

/** Normaliza a chave: minúsculo, sem acento, sem espaços/pontuação */
function normalizeKey(s: string) {
  return stripDiacritics(String(s).trim().toLowerCase()).replace(/[^a-z0-9]/g, "")
}

/** Mapa de sinônimos -> chave canônica da tabela */
const CANONICAL_MAP: Record<string, keyof Client | string> = {
  // nome/parte
  "executadoa": "EXECUTADO(A)",
  "executado": "EXECUTADO(A)",
  "nome": "EXECUTADO(A)",
  "name": "EXECUTADO(A)",

  // cpf/cnpj
  "cpf": "CPF",
  "cpfcnpj": "CPF",
  "cnpj": "CPF",
  "documento": "CPF",

  // telefone
  "telefone": "TELEFONE",
  "celular": "TELEFONE",
  "phone": "TELEFONE",
  "telefone1": "TELEFONE",
  "contato": "TELEFONE",

  // email
  "email": "email",
  "e-mail": "email",

  // processo
  "processo": "PROCESSO",
  "nprocesso": "PROCESSO",
  "numprocesso": "PROCESSO",
  "numeroprocesso": "PROCESSO",

  // loja
  "loja": "LOJA",
  "filial": "LOJA",

  // endereço
  "endereco": "ENDEREÇO",
  "endereco1": "ENDEREÇO",
  "endereco2": "ENDEREÇO",
  "address": "ENDEREÇO",
  "endereco_completo": "ENDEREÇO",
  "enderecoresidencial": "ENDEREÇO",
  "enderecores": "ENDEREÇO",

  // número (da rua)
  "numero": "NÚMERO",
  "num": "NÚMERO",
  "n": "NÚMERO",
  "number": "NÚMERO",

  // bairro
  "bairro": "BAIRRO",

  // cidade
  "cidade": "CIDADE",
  "municipio": "CIDADE",

  // status
  "status": "status",
}

/** Retorna o nome de coluna canônico para um cabeçalho qualquer. */
function toCanonicalHeader(header: string): keyof Client | string | null {
  const k = normalizeKey(header)
  return CANONICAL_MAP[k] ?? null
}

/** Extrai apenas dígitos de um valor para o campo NUMÉRICO */
function onlyDigits(value: any): string {
  return String(value ?? "").replace(/\D+/g, "")
}

/** Converte para número (ou null) com segurança (evita erro em coluna NUMERIC) */
function sanitizeNumericField(value: any): number | null {
  const digits = onlyDigits(value)
  if (!digits) return null
  const n = Number(digits)
  return Number.isFinite(n) ? n : null
}

/* UI auxiliares */

function ModernStatsCard({ title, value, change, changeType, icon: Icon, bgColor, subtitle }: {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ElementType
  bgColor: string
  subtitle?: string
}) {
  const ChangeIcon = ArrowUpRight

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
            <div className="flex items-center space-x-1">
              <ChangeIcon className={`h-4 w-4 ${changeType === 'increase' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'}`}>
                {change}
              </span>
              <span className="text-sm text-slate-500">vs mês anterior</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClientCard({ client, onView, onEdit, onDelete }: {
  client: Client
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const getStatusColor = () => {
    switch (client.status) {
      case "active": return "bg-green-100 text-green-800 border-green-200"
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "blocked": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusLabel = () => {
    switch (client.status) {
      case "active": return "Ativo"
      case "inactive": return "Inativo"
      case "pending": return "Pendente"
      case "blocked": return "Bloqueado"
      default: return "Ativo"
    }
  }

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {client["EXECUTADO(A)"] || "Nome não informado"}
              </h3>
              {client.PROCESSO && (
                <p className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  Processo: {client.PROCESSO}
                </p>
              )}
            </div>
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          </div>

          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.TELEFONE && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{client.TELEFONE}</span>
              </div>
            )}
            {(client["ENDEREÇO"] || client["ENDERECO"]) && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate">
                  {client["ENDEREÇO"] ?? client["ENDERECO"]}
                  {client.NÚMERO && `, ${client.NÚMERO}`}
                  {client.CIDADE && ` - ${client.CIDADE}`}
                </span>
              </div>
            )}
            {client.CPF && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <FileUser className="h-4 w-4 text-slate-400" />
                <span>{client.CPF}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onView}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ClientsModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean
    message: string
    details?: any
  }>({ connected: false, message: "Verificando conexão..." })
  const [isOnline, setIsOnline] = useState(true)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importData, setImportData] = useState<Client[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  // Novo Cliente (modal controlado)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newCpf, setNewCpf] = useState("")
  const [newAddress, setNewAddress] = useState("")

  function resetCreateForm() {
    setNewName("")
    setNewEmail("")
    setNewPhone("")
    setNewCpf("")
    setNewAddress("")
  }

  async function handleCreateClient() {
    if (!newName.trim()) {
      alert("Informe o nome do cliente.")
      return
    }

    // Validação prévia de CPF duplicado (opcional)
    if (newCpf.trim()) {
      const cpfDigits = newCpf.replace(/\D/g, "")
      if (cpfDigits.length === 11 || cpfDigits.length === 14) {
        // Verifica se CPF já existe na lista atual
        const existingClient = clients.find(c => 
          c.CPF?.replace(/\D/g, "") === cpfDigits
        )
        
        if (existingClient) {
          const confirmCreate = confirm(
            `Já existe um cliente com este CPF: ${existingClient["EXECUTADO(A)"] || "Nome não informado"}.\n\nDeseja criar mesmo assim?`
          )
          if (!confirmCreate) return
        }
      }
    }

    try {
      const clientData: any = {
        name: newName.trim(),
        "EXECUTADO(A)": newName.trim(),
        status: "active",
      }

      // Validações e adição de campos opcionais
      if (newEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(newEmail.trim())) {
          clientData.email = newEmail.trim()
        } else {
          alert("Email inválido")
          return
        }
      }

      if (newPhone.trim()) {
        const phoneDigits = newPhone.replace(/\D/g, "")
        if (phoneDigits.length >= 10 && phoneDigits.length <= 11) {
          clientData.TELEFONE = phoneDigits
        } else {
          alert("Telefone deve ter 10 ou 11 dígitos")
          return
        }
      }

      if (newCpf.trim()) {
        const cpfDigits = newCpf.replace(/\D/g, "")
        if (cpfDigits.length === 11 || cpfDigits.length === 14) {
          clientData.CPF = cpfDigits
        } else {
          alert("CPF deve ter 11 dígitos ou CNPJ 14 dígitos")
          return
        }
      }

      if (newAddress.trim()) {
        clientData.ENDERECO = newAddress.trim()
      }

      console.log("Enviando dados:", clientData)

      const client = await apiCreateClient(clientData)

      await loadClientsFromDatabase()
      setCreateModalOpen(false)
      resetCreateForm()
      alert(`✅ Cliente ${client?.["EXECUTADO(A)"] || newName} cadastrado com sucesso!`)

    } catch (error: any) {
      console.error("Erro ao cadastrar cliente:", error)

      let errorMessage = "Erro ao cadastrar o cliente"
      
      if (error.message) {
        if (error.message.includes("já existe")) {
          // Tratamento específico para CPF duplicado
          errorMessage = `⚠ CPF já cadastrado!\n\nEste CPF já existe no sistema. Verifique:\n• Se o cliente já foi cadastrado anteriormente\n• Se digitou o CPF corretamente\n\nDeseja buscar o cliente existente?`
          
          const searchExisting = confirm(errorMessage)
          if (searchExisting && newCpf.trim()) {
            // Busca pelo CPF na lista atual
            const cpfDigits = newCpf.replace(/\D/g, "")
            setSearchTerm(cpfDigits)
            return
          }
        } else if (error.message.includes("CPF")) {
          errorMessage = "CPF inválido. Use apenas números (11 dígitos para CPF, 14 para CNPJ)"
        } else if (error.message.includes("telefone") || error.message.includes("Telefone")) {
          errorMessage = "Telefone inválido. Use apenas números (10 ou 11 dígitos)"
        } else if (error.message.includes("obrigatório")) {
          errorMessage = "Nome é obrigatório"
        } else {
          errorMessage = error.message
        }
      }

      alert(errorMessage)
    }
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    initializeDatabase()
  }, [])

  useEffect(() => {
    const iv = setInterval(() => { loadClientsFromDatabase() }, 30000)
    return () => clearInterval(iv)
  }, [])

  const initializeDatabase = async () => {
    try {
      setIsLoading(true)
      const connectionResult = await checkApiConnection()
      setDbStatus({
        connected: connectionResult.success,
        message: connectionResult.message,
        details: connectionResult.details,
      })

      if (connectionResult.success) {
        await loadClientsFromDatabase()
      } else {
        loadClientsFromLocalStorage()
      }
    } catch (error) {
      console.error("Database initialization failed:", error)
      setDbStatus({
        connected: false,
        message: "Falha ao inicializar conexão com banco de dados",
        details: error,
      })
      loadClientsFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  const loadClientsFromDatabase = async () => {
    try {
      const data = await apiClient.getClients()
      setClients(data)
      setLastSynced(new Date())
      localStorage.setItem("law_firm_clients", JSON.stringify(data))
    } catch (error) {
      console.error("Error loading clients from database:", error)
      loadClientsFromLocalStorage()
    }
  }

  const loadClientsFromLocalStorage = () => {
    try {
      const savedClients = localStorage.getItem("law_firm_clients")
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients)
        setClients(parsedClients)
      }
    } catch (error) {
      console.error("Error loading clients from localStorage:", error)
    }
  }

  const retryConnection = async () => {
    setIsLoading(true)
    await initializeDatabase()
  }

  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter(c => c.status === "active").length
    const pending = clients.filter(c => c.status === "pending").length
    const thisMonth = clients.filter(c => {
      const clientDate = new Date(c.created_at || c["Data"] || "")
      const now = new Date()
      return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear()
    }).length

    return [
      {
        title: "Total de Clientes",
        value: total.toString(),
        change: "+12%",
        changeType: 'increase' as const,
        icon: Users,
        bgColor: "from-blue-500 to-blue-600",
        subtitle: "Todos os clientes"
      },
      {
        title: "Clientes Ativos",
        value: active.toString(),
        change: "+8%",
        changeType: 'increase' as const,
        icon: UserCheck,
        bgColor: "from-green-500 to-green-600",
        subtitle: "Em andamento"
      },
      {
        title: "Novos este Mês",
        value: thisMonth.toString(),
        change: "+25%",
        changeType: 'increase' as const,
        icon: UserPlus,
        bgColor: "from-purple-500 to-purple-600",
        subtitle: "Cadastrados"
      },
      {
        title: "Pendentes",
        value: pending.toString(),
        change: "-5%",
        changeType: 'decrease' as const,
        icon: Clock,
        bgColor: "from-yellow-500 to-yellow-600",
        subtitle: "Aguardando"
      },
    ]
  }, [clients])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        (client["EXECUTADO(A)"] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.TELEFONE || "").includes(searchTerm) ||
        (client.CPF || "").includes(searchTerm) ||
        (client.PROCESSO || "").includes(searchTerm)

      const matchesStatus = filterStatus === "all" || client.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, filterStatus])

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
  }

  const handleDeleteClient = async (client: Client) => {
    setClientToDelete(client)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      await apiDeleteClient(clientToDelete.id)
      await loadClientsFromDatabase()
      setClientToDelete(null)
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  const handleSaveClientEdit = async () => {
    if (!editingClient) return

    try {
      await apiUpdateClient(editingClient.id, editingClient)
      await loadClientsFromDatabase()
      setEditingClient(null)
    } catch (error) {
      console.error("Error updating client:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800 border-green-200", label: "Ativo" },
      inactive: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Inativo" },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pendente" },
      blocked: { color: "bg-red-100 text-red-800 border-red-200", label: "Bloqueado" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    if (isNaN(d as unknown as number)) return ""
    return d.toLocaleDateString("pt-BR")
  }

  const exportClients = () => {
    const csvContent = [
      "Nome,Email,Telefone,Endereço,CPF/CNPJ,Status,Data de Cadastro",
      ...filteredClients.map((client) =>
        [
          client["EXECUTADO(A)"] ?? "",
          client.email || "",
          client.TELEFONE || "",
          client["ENDEREÇO"] ?? client["ENDERECO"] ?? "",
          client.CPF || "",
          client.status,
          formatDate((client.created_at as any) || (client["Data"] as any) || ""),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Função de processamento de importação - CORRIGIDA
  const processImportFile = (file: File) => {
    setIsImporting(true)
    setImportProgress(0)
    setImportData([])

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        setImportProgress(30)
        
        const data = e.target?.result
        if (!data) {
          throw new Error("Arquivo vazio ou inválido")
        }

        let workbook: any
        let jsonData: any[][]

        // Detecta o tipo de arquivo e processa adequadamente
        if (file.name.endsWith('.csv')) {
          const text = data as string
          const lines = text.split('\n').filter(line => line.trim())
          jsonData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/['"]/g, '')))
        } else {
          workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: "",
            raw: false
          }) as any[][]
        }

        setImportProgress(60)

        if (!jsonData || jsonData.length < 2) {
          throw new Error("O arquivo está vazio ou não contém dados válidos")
        }

        // Cabeçalhos originais (primeira linha)
        const rawHeaders = (jsonData[0] as string[]).map(h => String(h ?? "").trim())
        
        if (rawHeaders.length === 0 || rawHeaders.every(h => !h)) {
          throw new Error("Nenhum cabeçalho encontrado no arquivo")
        }

        console.log("Cabeçalhos encontrados:", rawHeaders)

        const headerMap: { index: number; canonical: keyof Client | string | null; raw: string }[] =
          rawHeaders.map((h, i) => ({ 
            index: i, 
            canonical: toCanonicalHeader(h), 
            raw: h 
          }))

        console.log("Mapeamento de cabeçalhos:", headerMap)

        const rows = jsonData.slice(1).filter(row => 
          row && row.length > 0 && row.some(cell => String(cell ?? "").trim())
        )

        setImportProgress(80)

        const clients: Client[] = rows.map((row, rowIndex) => {
          const c: any = { 
            status: "active",
            created_at: new Date().toISOString()
          }

          headerMap.forEach(({ index, canonical }) => {
            const value = row[index]
            if (!canonical || !value) return

            const stringValue = String(value).trim()
            if (!stringValue) return

            // Tratamento específico para campos
            switch (canonical) {
              case "NÚMERO":
                const num = sanitizeNumericField(value)
                if (num !== null) c["NÚMERO"] = num
                break
                
              case "ENDEREÇO":
                c["ENDEREÇO"] = stringValue
                break
                
              case "CPF":
                c["CPF"] = stringValue
                break
                
              case "TELEFONE":
                c["TELEFONE"] = stringValue
                break
                
              case "EXECUTADO(A)":
                c["EXECUTADO(A)"] = stringValue
                break
                
              case "PROCESSO":
                c["PROCESSO"] = stringValue
                break
                
              case "LOJA":
                c["LOJA"] = stringValue
                break
                
              case "BAIRRO":
                c["BAIRRO"] = stringValue
                break
                
              case "CIDADE":
                c["CIDADE"] = stringValue
                break
                
              case "email":
                if (stringValue.includes('@') && stringValue.includes('.')) {
                  c["email"] = stringValue.toLowerCase()
                }
                break
                
              case "status":
                const statusValue = stringValue.toLowerCase()
                if (['active', 'inactive', 'pending', 'blocked'].includes(statusValue)) {
                  c["status"] = statusValue
                }
                break
                
              default:
                c[canonical as string] = stringValue
                break
            }
          })

          if (!c["EXECUTADO(A)"] && !c["nome"]) {
            console.warn(`Linha ${rowIndex + 2}: Cliente sem nome será ignorado`, c)
            return null
          }
          
          return c as Client
        }).filter((client): client is Client => client !== null)

        setImportProgress(100)

        console.log(`Processados ${clients.length} clientes válidos de ${rows.length} linhas`)
        console.log("Amostra dos dados processados:", clients.slice(0, 3))

        if (clients.length === 0) {
          throw new Error("Nenhum cliente válido encontrado no arquivo")
        }

        setImportData(clients)
        
      } catch (error: any) {
        console.error("Erro ao processar arquivo:", error)
        alert(`Erro ao processar arquivo: ${error?.message || error}`)
        setImportData([])
        setImportProgress(0)
      } finally {
        setIsImporting(false)
      }
    }

    reader.onerror = () => {
      console.error("Erro ao ler arquivo")
      alert("Erro ao ler o arquivo. Tente novamente.")
      setIsImporting(false)
      setImportProgress(0)
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const confirmImport = async () => {
    if (importData.length === 0) {
      alert("Nenhum dado para importar")
      return
    }

    setIsImporting(true)

    try {
      console.log("Iniciando importação de", importData.length, "clientes...")
      
      if (!dbStatus.connected) {
        throw new Error("Sem conexão com o banco de dados. Verifique sua conexão.")
      }

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < importData.length; i++) {
        try {
          const client = { ...importData[i] }
          
          if ('id' in client) {
            delete (client as any).id
          }

          console.log(`Importando cliente ${i + 1}:`, client)

          await apiCreateClient(client)
          successCount++
          
          setImportProgress(Math.round((i + 1) / importData.length * 100))
          
        } catch (error: any) {
          errorCount++
          const clientName = importData[i]["EXECUTADO(A)"] || `Linha ${i + 2}`
          const errorMsg = `${clientName}: ${error?.message || error}`
          errors.push(errorMsg)
          console.error(`Erro ao importar cliente ${i + 1}:`, error)
        }
      }

      await loadClientsFromDatabase()
      
      setImportModalOpen(false)
      setImportData([])
      setImportFile(null)
      setImportProgress(0)

      if (successCount > 0 && errorCount === 0) {
        alert(`✅ Sucesso! ${successCount} clientes importados com sucesso.`)
      } else if (successCount > 0 && errorCount > 0) {
        alert(`⚠️ Importação parcial: ${successCount} sucessos, ${errorCount} erros.\n\nErros:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
      } else {
        alert(`❌ Falha na importação. Nenhum cliente foi importado.\n\nErros:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
      }

    } catch (error: any) {
      console.error("Erro geral na importação:", error)
      alert(`Erro na importação: ${error?.message || error}`)
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Database className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600">Carregando clientes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestão de Clientes</h2>
            <p className="text-slate-300 text-lg">Sistema completo de gerenciamento de clientes</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {lastSynced && (
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  Sincronizado: {lastSynced.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!dbStatus.connected && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Modo Offline:</strong> {dbStatus.message}
                <br />
                <span className="text-sm">
                  Os dados estão sendo salvos localmente e serão sincronizados quando a conexão for restaurada.
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryConnection} 
                className="ml-4 bg-white hover:bg-orange-50 border-orange-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <ModernStatsCard key={index} {...stat} />
        ))}
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por nome, email, telefone, CPF ou processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 h-11">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-slate-200 rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`rounded-r-none ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`rounded-l-none ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" onClick={exportClients} className="h-11">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setImportModalOpen(true)} 
                className="h-11"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>

              <Dialog open={createModalOpen} onOpenChange={(o) => { setCreateModalOpen(o); if (!o) resetCreateForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-11 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-white text-slate-900 rounded-lg shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Cadastrar Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nome Completo *</Label>
                      <Input placeholder="Nome do cliente" className="h-11" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input type="email" placeholder="email@exemplo.com" className="h-11" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Telefone</Label>
                      <Input placeholder="(11) 99999-9999" className="h-11" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">CPF/CNPJ</Label>
                      <Input placeholder="000.000.000-00" className="h-11" value={newCpf} onChange={(e) => setNewCpf(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-sm font-medium">Endereço</Label>
                      <Input placeholder="Rua, número, bairro" className="h-11" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button variant="outline" onClick={() => { setCreateModalOpen(false); resetCreateForm(); }}>Cancelar</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateClient}>
                      Cadastrar Cliente
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'table' ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span>Lista de Clientes ({filteredClients.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Executado(a)</TableHead>
                    <TableHead className="font-semibold">CPF</TableHead>
                    <TableHead className="font-semibold">Contato</TableHead>
                    <TableHead className="font-semibold">Processo</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Nenhum cliente encontrado</h3>
                            <p className="text-slate-600">
                              {searchTerm || filterStatus !== "all" 
                                ? "Tente ajustar os filtros de busca"
                                : "Comece adicionando seu primeiro cliente"
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {client["EXECUTADO(A)"] || "Nome não informado"}
                            </p>
                            {client.LOJA && (
                              <p className="text-sm text-slate-500">Loja: {client.LOJA}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {client.CPF || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.TELEFONE && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-slate-400"/>
                                <span>{client.TELEFONE}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {client.PROCESSO || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedClient(client)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClient(client)}
                              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClient(client)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Nenhum cliente encontrado</h3>
                      <p className="text-slate-600">
                        {searchTerm || filterStatus !== "all" 
                          ? "Tente ajustar os filtros de busca"
                          : "Comece adicionando seu primeiro cliente"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onView={() => setSelectedClient(client)}
                onEdit={() => handleEditClient(client)}
                onDelete={() => handleDeleteClient(client)}
              />
            ))
          )}
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-3xl bg-white text-slate-900 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Nome Completo</Label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedClient["EXECUTADO(A)"] || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Email</Label>
                  <p className="text-base text-slate-700">
                    {selectedClient.email || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Telefone</Label>
                  <p className="text-base text-slate-700">
                    {selectedClient.TELEFONE || "Não informado"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-slate-600">CPF/CNPJ</Label>
                  <p className="text-base font-mono text-slate-700">
                    {selectedClient.CPF || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Processo</Label>
                  <p className="text-base font-mono text-slate-700">
                    {selectedClient.PROCESSO || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedClient.status)}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Edição */}
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
          <DialogContent className="max-w-3xl bg-white text-slate-900 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome/Executado(a)</Label>
                <Input 
                  defaultValue={editingClient["EXECUTADO(A)"] || ""} 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CPF/CNPJ</Label>
                <Input 
                  defaultValue={editingClient.CPF || ""} 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telefone</Label>
                <Input 
                  defaultValue={editingClient.TELEFONE || ""} 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input 
                  type="email"
                  defaultValue={editingClient.email || ""} 
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setEditingClient(null)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveClientEdit} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {clientToDelete && (
        <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Confirmar Exclusão</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-700 mb-4">
                Tem certeza que deseja excluir o cliente{" "}
                <strong className="text-slate-900">{clientToDelete["EXECUTADO(A)"]}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setClientToDelete(null)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteClient}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Importação - VERSÃO CORRIGIDA COM SCROLL */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Importar Clientes
            </DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel ou CSV para importar dados de clientes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                <div className="mx-auto w-12 h-12 text-blue-500 mb-4">
                  <Upload className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Arraste seu arquivo aqui ou
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImportFile(file)
                      processImportFile(file)
                    }
                  }}
                  className="hidden"
                  id="import-file"
                />
                <Label
                  htmlFor="import-file"
                  className="inline-block cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Selecionar Arquivo
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos suportados: .xlsx, .xls, .csv
                </p>
              </div>

              {/* Arquivo Selecionado */}
              {importFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{importFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImportFile(null)
                      setImportData([])
                      setImportProgress(0)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Progress Bar */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando arquivo...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Preview dos Dados */}
              {importData.length > 0 && !isImporting && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">Pré-visualização dos dados</h4>
                    <Badge variant="secondary" className="text-sm">
                      {importData.length} registros encontrados
                    </Badge>
                  </div>
                  
                  {/* Container com scroll para a tabela */}
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="max-h-80 overflow-y-auto import-table-scroll">
                      <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                          <TableRow>
                            <TableHead className="font-semibold">Nome/Executado</TableHead>
                            <TableHead className="font-semibold">CPF/CNPJ</TableHead>
                            <TableHead className="font-semibold">Telefone</TableHead>
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Processo</TableHead>
                            <TableHead className="font-semibold">Endereço</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importData.map((client, index) => (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="py-2 max-w-48 truncate">
                                {client["EXECUTADO(A)"] || "-"}
                              </TableCell>
                              <TableCell className="py-2 font-mono text-sm">
                                {client.CPF || "-"}
                              </TableCell>
                              <TableCell className="py-2">
                                {client.TELEFONE || "-"}
                              </TableCell>
                              <TableCell className="py-2 max-w-48 truncate">
                                {client.email || "-"}
                              </TableCell>
                              <TableCell className="py-2 font-mono text-sm">
                                {client.PROCESSO || "-"}
                              </TableCell>
                              <TableCell className="py-2 max-w-48 truncate">
                                {client["ENDEREÇO"] || client["ENDERECO"] || "-"}
                                {client["NÚMERO"] && `, ${client["NÚMERO"]}`}
                                {client.CIDADE && ` - ${client.CIDADE}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Dados processados com sucesso
                        </p>
                        <p className="text-sm text-blue-700">
                          {importData.length} clientes prontos para importação. 
                          Verifique os dados acima antes de confirmar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem de erro se não conseguir processar */}
              {importFile && importData.length === 0 && !isImporting && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Não foi possível processar o arquivo. Verifique se
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>O arquivo não está corrompido</li>
                      <li>Contém dados válidos na primeira planilha</li>
                      <li>Possui pelo menos uma linha de cabeçalho</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setImportModalOpen(false)
                setImportFile(null)
                setImportData([])
                setImportProgress(0)
              }}
              disabled={isImporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importData.length === 0 || isImporting}
              className="bg-blue-600 hover:bg-blue-700 min-w-32"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {importData.length} Clientes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
