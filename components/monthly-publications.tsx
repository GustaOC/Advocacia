"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Calendar, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  ArrowUpRight,
  FileText
} from "lucide-react"

// Componente de loading moderno
function ModuleLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando relatórios...</p>
      </div>
    </div>
  )
}

// Componente de estatísticas moderno
function ModernStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  bgColor 
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  color: string
  bgColor: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-600">{subtitle}</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MonthlyPublications() {
  const [selectedMonth, setSelectedMonth] = useState("2024-01")
  const [selectedYear, setSelectedYear] = useState("2024")

  // Mock data for monthly publications
  const monthlyData = {
    "2024-01": {
      totalPublications: 45,
      completed: 32,
      pending: 8,
      overdue: 5,
      productivity: 71,
      responsibleStats: [
        { name: "Dr. Cássio Miguel", total: 30, completed: 22, pending: 5, overdue: 3 },
        { name: "Dra. Ana Silva", total: 15, completed: 10, pending: 3, overdue: 2 },
      ],
      dailyBreakdown: [
        { date: "2024-01-01", publications: 2, completed: 2, pending: 0, overdue: 0 },
        { date: "2024-01-02", publications: 3, completed: 2, pending: 1, overdue: 0 },
        { date: "2024-01-03", publications: 1, completed: 1, pending: 0, overdue: 0 },
        { date: "2024-01-04", publications: 4, completed: 3, pending: 0, overdue: 1 },
        { date: "2024-01-05", publications: 2, completed: 1, pending: 1, overdue: 0 },
        { date: "2024-01-08", publications: 5, completed: 4, pending: 1, overdue: 0 },
        { date: "2024-01-09", publications: 3, completed: 2, pending: 1, overdue: 0 },
        { date: "2024-01-10", publications: 6, completed: 4, pending: 1, overdue: 1 },
        { date: "2024-01-11", publications: 2, completed: 2, pending: 0, overdue: 0 },
        { date: "2024-01-12", publications: 4, completed: 3, pending: 0, overdue: 1 },
        { date: "2024-01-15", publications: 3, completed: 2, pending: 1, overdue: 0 },
        { date: "2024-01-16", publications: 2, completed: 1, pending: 1, overdue: 0 },
        { date: "2024-01-17", publications: 5, completed: 4, pending: 0, overdue: 1 },
        { date: "2024-01-18", publications: 3, completed: 3, pending: 0, overdue: 0 },
        { date: "2024-01-19", publications: 4, completed: 2, pending: 2, overdue: 0 },
      ],
    },
  }

  const currentData = monthlyData[selectedMonth as keyof typeof monthlyData] || monthlyData["2024-01"]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const getStatusBadge = (status: string, count: number) => {
    if (count === 0) return null

    const statusConfig = {
      completed: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      overdue: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{count}</span>
      </Badge>
    )
  }

  const calculateProductivity = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center space-x-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <span>Relatório Mensal de Publicações</span>
              </h2>
              <p className="text-slate-300 text-lg">Acompanhe a produtividade e estatísticas mensais do escritório</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Período selecionado</p>
              <p className="text-white font-semibold text-lg">Janeiro 2024</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-01">Janeiro 2024</SelectItem>
                    <SelectItem value="2024-02">Fevereiro 2024</SelectItem>
                    <SelectItem value="2024-03">Março 2024</SelectItem>
                    <SelectItem value="2024-04">Abril 2024</SelectItem>
                    <SelectItem value="2024-05">Maio 2024</SelectItem>
                    <SelectItem value="2024-06">Junho 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ModernStatsCard
            title="Total de Publicações"
            value={currentData.totalPublications}
            subtitle="+15% vs mês anterior"
            icon={Calendar}
            color="text-blue-600"
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModernStatsCard
            title="Concluídas"
            value={currentData.completed}
            subtitle={`${calculateProductivity(currentData.completed, currentData.totalPublications)}% do total`}
            icon={CheckCircle}
            color="text-emerald-600"
            bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <ModernStatsCard
            title="Pendentes"
            value={currentData.pending}
            subtitle={`${calculateProductivity(currentData.pending, currentData.totalPublications)}% do total`}
            icon={Clock}
            color="text-yellow-600"
            bgColor="bg-gradient-to-br from-yellow-500 to-yellow-600"
          />
          <ModernStatsCard
            title="Em Atraso"
            value={currentData.overdue}
            subtitle={`${calculateProductivity(currentData.overdue, currentData.totalPublications)}% do total`}
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        {/* Productivity by Responsible */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <span>Produtividade por Responsável</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Responsável</TableHead>
                    <TableHead className="font-semibold text-slate-700">Total</TableHead>
                    <TableHead className="font-semibold text-slate-700">Concluídas</TableHead>
                    <TableHead className="font-semibold text-slate-700">Pendentes</TableHead>
                    <TableHead className="font-semibold text-slate-700">Em Atraso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Produtividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.responsibleStats.map((person, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <TableCell className="font-medium text-slate-900">{person.name}</TableCell>
                      <TableCell className="text-slate-600">{person.total}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900">{person.completed}</span>
                          {getStatusBadge("completed", person.completed)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900">{person.pending}</span>
                          {getStatusBadge("pending", person.pending)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-900">{person.overdue}</span>
                          {getStatusBadge("overdue", person.overdue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-slate-600 to-slate-700 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${calculateProductivity(person.completed, person.total)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {calculateProductivity(person.completed, person.total)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
              <span>Detalhamento Diário</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Data</TableHead>
                    <TableHead className="font-semibold text-slate-700">Total</TableHead>
                    <TableHead className="font-semibold text-slate-700">Concluídas</TableHead>
                    <TableHead className="font-semibold text-slate-700">Pendentes</TableHead>
                    <TableHead className="font-semibold text-slate-700">Em Atraso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status Visual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.dailyBreakdown.map((day, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <TableCell className="font-medium text-slate-900">{formatDate(day.date)}</TableCell>
                      <TableCell className="text-slate-600">{day.publications}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{day.completed}</TableCell>
                      <TableCell className="text-yellow-600 font-medium">{day.pending}</TableCell>
                      <TableCell className="text-red-600 font-medium">{day.overdue}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {getStatusBadge("completed", day.completed)}
                          {getStatusBadge("pending", day.pending)}
                          {getStatusBadge("overdue", day.overdue)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
