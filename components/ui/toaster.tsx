"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

// Definindo o tipo de variante explicitamente para incluir 'success'
type ToastVariant = "default" | "destructive" | "success" | null | undefined;

export function Toaster() {
  const { toasts } = useToast()

  // Função para obter o ícone correto com base na variante
  const getIcon = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'destructive':
        return <XCircle className="h-5 w-5 text-destructive-foreground" />;
      default:
        return <Info className="h-5 w-5 text-foreground" />;
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant as "default" | "destructive" | "success" | undefined}>
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(variant)}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}