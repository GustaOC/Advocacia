'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, CheckCircle, MessageCircle } from 'lucide-react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    urgency: '',
    message: ''
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus('success');
    
    // Reset form after success
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        urgency: '',
        message: ''
      });
      setStatus('idle');
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de agendar uma consulta jurídica.\n\nNome: ${formData.name}\nAssunto: ${formData.subject}\nUrgência: ${formData.urgency}\nMensagem: ${formData.message}`
    );
    window.open(`https://wa.me/5567996449627?text=${message}`, '_blank');
  };

  if (status === 'success') {
    return (
      <div className="text-center p-8 rounded-xl" style={{backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b'}}>
        <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{color: '#1e293b'}} />
        <h3 className="font-semibold text-xl mb-2">Mensagem Enviada com Sucesso!</h3>
        <p className="mb-4">Obrigado pelo seu contato. Retornaremos em até 2 horas.</p>
        <div className="space-y-2">
          <p className="text-sm font-medium">Para atendimento mais rápido:</p>
          <Button 
            onClick={handleWhatsApp}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversar no WhatsApp
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2" style={{color: '#1e293b'}}>
          Primeira Consulta Gratuita
        </h3>
        <p className="text-slate-600">
          Preencha o formulário ou entre em contato pelo WhatsApp
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 font-medium">Nome Completo *</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Seu nome completo" 
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required 
              className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700 font-medium">Telefone/WhatsApp *</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="(67) 99999-9999" 
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required 
              className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-medium">E-mail *</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="seu@email.com" 
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required 
            className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Área Jurídica</Label>
            <Select value={formData.subject} onValueChange={(value) => handleChange('subject', value)}>
              <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direito-civil">Direito Civil</SelectItem>
                <SelectItem value="direito-empresarial">Direito Empresarial</SelectItem>
                <SelectItem value="direito-consumidor">Direito do Consumidor</SelectItem>
                <SelectItem value="consultoria-preventiva">Consultoria Preventiva</SelectItem>
                <SelectItem value="direito-familia">Direito de Família</SelectItem>
                <SelectItem value="contratos">Contratos</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Urgência</Label>
            <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value)}>
              <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Nível de urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta - Preciso hoje</SelectItem>
                <SelectItem value="media">Média - Esta semana</SelectItem>
                <SelectItem value="baixa">Baixa - Posso aguardar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-slate-700 font-medium">Descreva Seu Caso *</Label>
          <Textarea 
            id="message" 
            placeholder="Conte-nos sobre sua situação jurídica. Quanto mais detalhes, melhor poderemos ajudá-lo..." 
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            required 
            className="min-h-[120px] border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" 
          />
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
          <p className="text-sm text-center" style={{color: '#334155'}}>
            Ao enviar este formulário, você concorda com nossos 
            <span style={{color: '#1e293b'}} className="font-medium"> termos de privacidade</span>. 
            Seus dados estão seguros e não serão compartilhados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="font-semibold h-12 hover:opacity-90 transition-opacity"
            style={{backgroundColor: '#1e293b', color: '#ffffff'}}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Enviar Mensagem
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsApp}
            className="border-green-500 text-green-600 hover:bg-green-50 h-12"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            WhatsApp Direto
          </Button>
        </div>
      </form>
    </div>
  )
}