'use client' 

import Image from "next/image"
import Link from "next/link"
import { Briefcase, MessageCircle, Scale, ShieldCheck, Users } from "lucide-react"
import ContactForm from "@/components/ContactForm"
import AnimatedSection from "@/components/AnimatedSection"
import { Card, CardContent } from "@/components/ui/card"
import HeroButtons from "@/components/HeroButtons"

// Seção Hero
function HeroModern() {
  return (
    <section className="relative bg-gradient-to-b from-white to-slate-50/50 overflow-hidden">
      <div className="container-custom grid lg:grid-cols-2 gap-12 items-center py-20 md:py-28">
        <AnimatedSection delay={0.1}>
          {/* ✅ CORREÇÃO: Adicionadas classes para centralizar o texto em telas menores */}
          <div className="space-y-6 text-center lg:text-left">
            {/* ✅ CORREÇÃO: Aplicada a nova fonte 'font-serif' */}
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-brand leading-tight tracking-normal">
              Assessoria jurídica especializada em direito civil e empresarial.
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto lg:mx-0">
              Atendimento personalizado em Campo Grande — soluções práticas e seguras para pessoas e empresas.
            </p>
            {/* ✅ CORREÇÃO: Centralizando os botões em telas menores */}
            <div className="flex justify-center lg:justify-start">
                <HeroButtons />
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={0.2} className="relative hidden lg:flex justify-center items-center">
          <div className="absolute -inset-8 bg-gradient-to-r from-accent/30 to-brand-700/30 rounded-full blur-3xl opacity-40"></div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full max-w-md border-8 border-white">
            <Image 
              src="https://i.postimg.cc/4NmVt2Gp/AAAA.jpg" 
              width={500} 
              height={600} 
              alt="Escritório de Advocacia Cássio Miguel" 
              priority 
              className="w-full h-auto object-cover"
            />
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ... (o restante do arquivo permanece o mesmo) ...

// Seção de Serviços
function ServicesSection() {
    const services = [
        { icon: Scale, title: "Direito Civil", description: "Resolução de conflitos, contratos, responsabilidade civil e questões de família e sucessões." },
        { icon: Briefcase, title: "Direito Empresarial", description: "Consultoria para constituição de empresas, contratos comerciais, e recuperação judicial." },
        { icon: Users, title: "Direito do Consumidor", description: "Defesa dos seus direitos em relações de consumo, produtos e serviços." },
        { icon: ShieldCheck, title: "Consultoria Preventiva", description: "Análise de riscos e orientação para evitar litígios e garantir conformidade legal." },
    ];
    return (
        <section id="servicos" className="py-20 bg-white">
            <div className="container-custom text-center">
              <AnimatedSection delay={0.2}>
                <h2 className="font-heading text-3xl font-bold text-brand mb-4">Áreas de Atuação</h2>
                <p className="text-muted max-w-2xl mx-auto mb-12">Oferecemos uma gama completa de serviços jurídicos com foco em resultados e na segurança dos nossos clientes.</p>
              </AnimatedSection>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                      <AnimatedSection key={service.title} delay={0.3 + index * 0.1}>
                        <div className="bg-slate-50/50 p-8 rounded-lg border border-border/50 hover:shadow-xl hover:border-accent transition-all h-full flex flex-col items-center text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-accent/10 text-accent rounded-lg mb-4">
                                <service.icon className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold text-xl mb-2 text-brand">{service.title}</h3>
                            <p className="text-sm text-muted">{service.description}</p>
                        </div>
                      </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Seção Sobre
function AboutSection() {
    return (
        <section id="sobre" className="py-20">
             <div className="container-custom text-center">
               <AnimatedSection delay={0.2}>
                <h2 className="font-heading text-3xl font-bold text-brand mb-4">Sobre Nós</h2>
                <p className="text-muted max-w-2xl mx-auto">
                    Nosso compromisso é com a ética, transparência e a busca incessante pela melhor solução jurídica para cada caso.
                </p>
               </AnimatedSection>
            </div>
        </section>
    );
}

// Seção de Contato
function ContactSection() {
    return (
        <section id="contato" className="py-20 bg-white">
             <div className="container-custom">
                <AnimatedSection delay={0.2}>
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="font-heading text-3xl font-bold text-brand mb-4">Entre em Contato</h2>
                        <p className="text-muted mb-12">
                            Estamos à disposição para ouvir seu caso e oferecer a orientação necessária. Preencha o formulário abaixo ou nos chame no WhatsApp.
                        </p>
                    </div>
                     <div className="max-w-3xl mx-auto">
                        <Card className="shadow-lg border-border/60">
                            <CardContent className="p-8">
                                <ContactForm />
                            </CardContent>
                        </Card>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}

// Componente principal da página
export default function HomePage() {
  return (
    <>
      <HeroModern />
      <ServicesSection />
      <AboutSection />
      <ContactSection />
    </>
  )
}