"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Lock, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    role: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadUserProfile()
    }
  }, [isOpen])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile")
      if (response.ok) {
        const { user } = await response.json()
        setUserProfile({
          name: user.name || "",
          email: user.email || "",
          role: user.role?.name || "",
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil do usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userProfile.name,
          email: userProfile.email,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso",
        })
      } else {
        const { error } = await response.json()
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso",
        })
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const { error } = await response.json()
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar senha",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações do Usuário</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Perfil do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>
                      {userProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userProfile.name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      value={userProfile.name}
                      onChange={(e) => setUserProfile((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={handleProfileUpdate} disabled={loading} className="bg-[#2C3E50] hover:bg-[#3D566E]">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>

            {/* Alteração de Senha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Alterar Senha</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>

                <Button onClick={handlePasswordChange} disabled={loading} variant="outline">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
