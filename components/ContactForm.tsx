'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from 'lucide-react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="text-center bg-green-50 border border-green-200 text-green-800 p-8 rounded-lg">
        <h3 className="font-semibold text-xl mb-2">Mensagem Enviada!</h3>
        <p>Obrigado pelo seu contato. Retornaremos em breve.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Seu Nome</Label>
          <Input id="name" name="name" type="text" placeholder="Nome completo" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Seu Email</Label>
          <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" type="text" placeholder="Ex: Consulta sobre Direito de Família" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Sua Mensagem</Label>
        <Textarea id="message" name="message" placeholder="Descreva brevemente o seu caso..." required className="min-h-[120px]" />
      </div>
      <div className="text-right">
        <Button type="submit" size="lg" variant="primary" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          {status === 'loading' ? 'Enviando...' : 'Enviar Mensagem'}
        </Button>
      </div>
    </form>
  )
}