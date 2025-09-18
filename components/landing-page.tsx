// components/landing-page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Users, Award, Clock, MessageCircle, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function LandingPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Aqui você adicionaria a lógica de envio para uma API de contato
    alert("Mensagem enviada! (Simulação)");
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de agendar uma consulta jurídica.");
    window.open(`https://wa.me/5567996449627?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="relative w-40 h-12">
            <Image 
              src="/logo.png" 
              alt="Cássio Miguel Advocacia" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="#inicio" className="font-medium hover:text-slate-900 transition-colors">Início</Link>
            <Link href="#servicos" className="font-medium hover:text-slate-900 transition-colors">Serviços</Link>
            <Link href="#sobre" className="font-medium hover:text-slate-900 transition-colors">Sobre</Link>
            <Link href="#contato" className="font-medium hover:text-slate-900 transition-colors">Contato</Link>
            <Link href="/login" passHref>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                <User className="h-4 w-4" />
                Área Interna
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="py-20 container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-4 py-2 rounded-xl">Advocacia Especializada</Badge>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight">
              Defendendo seus <span className="text-slate-600">direitos</span> com excelência
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Soluções jurídicas personalizadas para pessoas e empresas em Campo Grande - MS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleWhatsApp} size="lg" className="bg-slate-800 hover:bg-slate-900 text-white">
                <MessageCircle className="mr-2 h-5 w-5" />
                Agendar Consulta
              </Button>
              <Button size="lg" variant="outline" className="border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white">
                Nossos Serviços
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <Image src="https://i.postimg.cc/4NmVt2Gp/AAAA.jpg" alt="Dr. Cássio Miguel" width={500} height={600} className="w-full h-auto object-cover" />
            </div>
          </div>
        </section>

        {/* O restante do componente continua o mesmo... */}

      </main>

      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-6 text-center text-slate-300">
          <p>&copy; {new Date().getFullYear()} Cássio Miguel Advocacia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}