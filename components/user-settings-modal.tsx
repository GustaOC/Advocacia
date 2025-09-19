// components/user-settings-modal.tsx
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
import { useAuth } from "@/hooks/use-auth" // Importando o hook de autenticação
import { createClient } from "@/lib/supabase/client" // Importando o cliente Supabase

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { toast } = useToast()
  const { user, isLoading: isUserLoading } = useAuth(); // Usando o hook de autenticação
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    role: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  // Inicializa o cliente Supabase no componente
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && user) {
      setUserProfile({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
      })
    }
  }, [isOpen, user])


  const handleProfileUpdate = async () => {
    // A lógica para atualizar o nome e email (metadados do usuário) seria implementada aqui.
    // Por enquanto, vamos manter o foco na senha.
    toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A atualização de nome e email será implementada em breve.",
    });
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO DE SEGURANÇA: Usando o método seguro do Supabase para atualizar a senha.
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({ title: "Sucesso", description: "Senha alterada com sucesso." });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      onClose(); // Fecha o modal após o sucesso

    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações do Usuário</DialogTitle>
        </DialogHeader>

        {(isUserLoading || loading) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!(isUserLoading || loading) && user && (
          <div className="space-y-6">
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
                      {userProfile.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userProfile.name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile.role}</p>
                  </div>
                </div>
                <div><Label>Email</Label><Input type="email" value={userProfile.email} disabled /></div>
                <Button onClick={handleProfileUpdate} disabled={true} className="bg-[#2C3E50] hover:bg-[#3D566E]">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações (Em Breve)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Alterar Senha</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Nova Senha</Label><Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} /></div>
                <div><Label>Confirmar Nova Senha</Label><Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} /></div>
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