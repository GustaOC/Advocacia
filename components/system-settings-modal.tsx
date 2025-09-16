"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Bell, Shield, Palette, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SystemSettingsModal({ isOpen, onClose }: SystemSettingsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    office_name: "",
    default_deadline_days: "7",
    notification_reminder_days: "3",
    email_notifications: "true",
    push_notifications: "true",
    deadline_alerts: "true",
    payment_alerts: "true",
    auto_backup: "true",
    maintenance_mode: "false",
    debug_mode: "false",
    theme: "light",
    language: "pt-BR",
    backup_frequency: "daily",
    backup_retention: "30",
  })

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings")
      if (response.ok) {
        const { settings: apiSettings } = await response.json()
        setSettings((prev) => ({ ...prev, ...apiSettings }))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        })
      } else {
        const { error } = await response.json()
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Sistema</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome do Escritório</Label>
                  <Input
                    value={settings.office_name}
                    onChange={(e) => updateSetting("office_name", e.target.value)}
                    placeholder="Nome do seu escritório"
                  />
                </div>
                <div>
                  <Label>Prazo Padrão (dias)</Label>
                  <Input
                    type="number"
                    value={settings.default_deadline_days}
                    onChange={(e) => updateSetting("default_deadline_days", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Dias para Lembrete de Prazo</Label>
                  <Input
                    type="number"
                    value={settings.notification_reminder_days}
                    onChange={(e) => updateSetting("notification_reminder_days", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notificações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificações por Email</Label>
                  <Switch
                    checked={settings.email_notifications === "true"}
                    onCheckedChange={(checked) => updateSetting("email_notifications", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notificações Push</Label>
                  <Switch
                    checked={settings.push_notifications === "true"}
                    onCheckedChange={(checked) => updateSetting("push_notifications", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Alertas de Prazo</Label>
                  <Switch
                    checked={settings.deadline_alerts === "true"}
                    onCheckedChange={(checked) => updateSetting("deadline_alerts", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Alertas de Pagamento</Label>
                  <Switch
                    checked={settings.payment_alerts === "true"}
                    onCheckedChange={(checked) => updateSetting("payment_alerts", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Backup Automático</Label>
                  <Switch
                    checked={settings.auto_backup === "true"}
                    onCheckedChange={(checked) => updateSetting("auto_backup", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Modo de Manutenção</Label>
                  <Switch
                    checked={settings.maintenance_mode === "true"}
                    onCheckedChange={(checked) => updateSetting("maintenance_mode", checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Modo Debug</Label>
                  <Switch
                    checked={settings.debug_mode === "true"}
                    onCheckedChange={(checked) => updateSetting("debug_mode", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Aparência</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tema</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Backup e Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Frequência de Backup</Label>
                  <Select
                    value={settings.backup_frequency}
                    onValueChange={(value) => updateSetting("backup_frequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Retenção de Backup (dias)</Label>
                  <Input
                    type="number"
                    value={settings.backup_retention}
                    onChange={(e) => updateSetting("backup_retention", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading} className="bg-[#2C3E50] hover:bg-[#3D566E]">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
