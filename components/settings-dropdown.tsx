"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, Shield, Database } from "lucide-react"

interface SettingsDropdownProps {
  onEmployeeManagement?: () => void
  onUserSettings?: () => void
  onSystemSettings?: () => void
}

export function SettingsDropdown({ onEmployeeManagement, onUserSettings, onSystemSettings }: SettingsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Configurações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onUserSettings}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil do Usuário</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmployeeManagement}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Gerenciar Funcionários</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSystemSettings}>
          <Database className="mr-2 h-4 w-4" />
          <span>Configurações do Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
