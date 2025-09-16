"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Users, Award, Clock, MessageCircle, Facebook, Instagram, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    setFormData({ name: "", email: "", phone: "", message: "" })
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de agendar uma consulta jurídica.")
    window.open(`https://wa.me/5567996449627?text=${message}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative w-40 h-12">
                <Image
                  src="/logo.png"
                  alt="Cássio Miguel Advocacia"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              {["Início", "Serviços", "Sobre", "Contato"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-slate-700 hover:text-slate-900 transition-all duration-300 relative group py-2 font-medium"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-800 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                <User className="h-4 w-4" />
                Área do Funcionário
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="início" className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-4 py-2 rounded-xl">
                  Advocacia Especializada
                </Badge>
                <h1 className="text-5xl font-bold text-slate-900 leading-tight">
                  Defendendo seus{" "}
                  <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    direitos
                  </span>{" "}
                  com excelência
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Mais de 15 anos de experiência oferecendo soluções jurídicas personalizadas para pessoas físicas e
                  empresas em Campo Grande - MS.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleWhatsApp}
                  className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-3 text-lg transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Consulta Gratuita
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white px-8 py-3 text-lg bg-transparent transition-all duration-300 rounded-xl"
                >
                  Nossos Serviços
                </Button>
              </div>
            </div>

            <div className="relative">
              <div
                className="relative z-10 rounded-3xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-2xl"
              >
                <Image
                  src="https://i.postimg.cc/4NmVt2Gp/AAAA.jpg"
                  alt="Dr. Cássio Miguel - Advogado"
                  width={500}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "15+", label: "Anos de Experiência" },
              { value: "500+", label: "Casos Resolvidos" },
              { value: "98%", label: "Taxa de Sucesso" },
              { value: "24h", label: "Tempo de Resposta" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="serviços" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Áreas de Atuação
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Oferecemos serviços jurídicos especializados em diversas áreas do direito
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Direito Civil",
                description: "Contratos, responsabilidade civil, direitos reais e obrigações.",
              },
              {
                icon: Users,
                title: "Direito de Família",
                description: "Divórcio, guarda, pensão alimentícia e inventário.",
              },
              {
                icon: Award,
                title: "Direito Trabalhista",
                description: "Rescisões, verbas trabalhistas e processos na Justiça do Trabalho.",
              },
              {
                icon: Clock,
                title: "Direito Previdenciário",
                description: "Aposentadorias, benefícios e revisões no INSS.",
              },
              {
                icon: Users,
                title: "Direito Empresarial",
                description: "Constituição de empresas, contratos comerciais e consultoria.",
              },
              {
                icon: Users,
                title: "Direito do Consumidor",
                description: "Defesa dos direitos do consumidor e relações de consumo.",
              },
            ].map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl overflow-hidden"
              >
                <CardContent className="p-8">
                  <service.icon className="h-12 w-12 text-slate-800 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-3 text-center">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-center">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                Sobre Dr. Cássio Miguel
              </h2>
              <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
                <p>
                  Advogado formado pela Universidade Federal de Mato Grosso do Sul (UFMS), com mais de 15 anos de
                  experiência na advocacia. Especialista em Direito Civil e Direito de Família, com pós-graduação em
                  Direito Processual Civil.
                </p>
                <p>
                  Membro da Ordem dos Advogados do Brasil - Seção Mato Grosso do Sul (OAB/MS), sempre comprometido com a
                  ética profissional e a defesa dos interesses de seus clientes.
                </p>
                <p>
                  Atua em Campo Grande e região, oferecendo atendimento personalizado e soluções jurídicas eficazes para
                  pessoas físicas e empresas.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1 rounded-lg">
                  OAB/MS 12.345
                </Badge>
                <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1 rounded-lg">
                  Especialista em Direito Civil
                </Badge>
                <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1 rounded-lg">
                  Pós-graduado UFMS
                </Badge>
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200">
                <div className="space-y-6">
                  {[
                    { icon: Award, title: "Formação Acadêmica", description: "UFMS - Direito" },
                    { icon: Users, title: "Experiência Profissional", description: "15+ anos de advocacia" },
                    { icon: Award, title: "Especialização", description: "Direito Civil e Família" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <item.icon className="h-8 w-8 text-slate-800" />
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Entre em Contato
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Agende sua consulta e tire suas dúvidas jurídicas
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-6">
                {[
                  { icon: MapPin, title: "Endereço", content: "Rua Nelson Figueiredo Junior, 80\nCampo Grande - MS" },
                  { icon: Phone, title: "Telefone", content: "(67) 99644-9627" },
                  { icon: Mail, title: "Email", content: "contato@cassiomiguel.adv.br" },
                  { icon: Clock, title: "Horário de Atendimento", content: "Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <item.icon className="h-6 w-6 text-slate-800 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-slate-600 whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleWhatsApp}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar no WhatsApp
              </Button>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {[
                    { label: "Nome Completo", type: "text", value: formData.name, key: "name" },
                    { label: "Email", type: "email", value: formData.email, key: "email" },
                    { label: "Telefone", type: "tel", value: formData.phone, key: "phone" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        {field.label}
                      </label>
                      <Input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="border-slate-300 focus:border-slate-500 bg-white/50 rounded-xl h-12"
                        required
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="border-slate-300 focus:border-slate-500 bg-white/50 rounded-xl min-h-[120px]"
                      placeholder="Descreva brevemente seu caso..."
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white py-3 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
                  >
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={handleWhatsApp}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl hover:scale-105 transition-all duration-300"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.png"
                    alt="Cássio Miguel Advocacia"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Cássio Miguel Advocacia
                  </h3>
                </div>
              </div>
              <p className="text-slate-300 mb-4">
                Defendendo seus direitos com excelência e dedicação há mais de 15 anos.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com/cassiomigueladvocacia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors duration-300"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a
                  href="https://instagram.com/cassiomigueladvocacia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors duration-300"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">
                Contato
              </h4>
              <div className="space-y-2 text-slate-300">
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Rua Nelson Figueiredo Junior, 80
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  (67) 99644-9627
                </p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  contato@cassiomiguel.adv.br
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">
                Áreas de Atuação
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li>Direito Civil</li>
                <li>Direito de Família</li>
                <li>Direito Trabalhista</li>
                <li>Direito Previdenciário</li>
                <li>Direito Empresarial</li>
                <li>Direito do Consumidor</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-300">
            <p>
              &copy; 2024 Cássio Miguel Advocacia. Todos os direitos reservados.
            </p>
            <p className="mt-2 text-sm">
              OAB/MS 12.345
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
