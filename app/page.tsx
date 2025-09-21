// app/page.tsx
'use client'

import Image from "next/image"
import Link from "next/link"
import { Briefcase, MessageCircle, Scale, ShieldCheck, Users, Star, Award, CheckCircle, Phone, Mail, MapPin, Clock, ArrowRight, Quote } from "lucide-react"
import Header from "@/components/Header" // <-- Adicionado
import Footer from "@/components/Footer" // <-- Adicionado
import ContactForm from "@/components/ContactForm"
import AnimatedSection from "@/components/AnimatedSection"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Seção Hero Melhorada
function HeroModern() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Pattern - Corrigido */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
      
      <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-12 items-center py-20">
        <AnimatedSection delay={0.1}>
          <div className="space-y-8 text-center lg:text-left text-white">
            {/* Badge de Destaque */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#1e293b', color: 'white' }}>
              <Award className="w-4 h-4 mr-2" style={{ color: 'white' }} />
              Mais de 15 anos de experiência
            </div>
            
            {/* Título Principal - Azul escuro quase preto */}
            <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight">
              <span style={{color: '#1e293b'}} className="block">Defesa Jurídica</span>
              <span style={{color: '#1e293b'}} className="block">Especializada</span>
            </h1>
            
            {/* Subtítulo - Azul escuro quase preto */}
            <p className="text-xl lg:text-2xl leading-relaxed max-w-2xl" style={{color: '#334155'}}>
              Soluções jurídicas personalizadas em Direito Civil e Empresarial com foco em resultados excepcionais para você.
            </p>
            
            {/* Pontos de Destaque - Azul escuro quase preto */}
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                <span style={{color: '#334155'}}>Atendimento 24h</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                <span style={{color: '#334155'}}>Primeira consulta gratuita</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                <span style={{color: '#334155'}}>98% de casos ganhos</span>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="font-semibold px-8 py-4 text-lg text-white hover:opacity-90 transition-opacity"
                style={{backgroundColor: '#1e293b'}}
                onClick={() => window.open('https://wa.me/5567996449627', '_blank')}
              >
                <MessageCircle className="mr-2 h-5 w-5" /> 
                Consulta Gratuita
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg"
              >
                <Link href="#sobre">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Conheça o Escritório
                </Link>
              </Button>
            </div>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={0.2} className="relative hidden lg:flex justify-center items-center">
          <div className="relative">
            {/* Círculo decorativo */}
            <div className="absolute -inset-8 bg-gradient-to-r from-accent/30 to-accent/10 rounded-full blur-3xl"></div>
            
            {/* Container da imagem */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm">
              <Image 
                src="https://i.postimg.cc/4NmVt2Gp/AAAA.jpg" 
                width={500} 
                height={600} 
                alt="Dr. Cássio Miguel - Advogado Especialista" 
                priority 
                className="w-full h-auto object-cover"
              />
              
              {/* Overlay com informações */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6">
                <div className="text-white">
                  <h3 className="font-bold text-xl mb-1">Dr. Cássio Miguel</h3>
                  <p className="text-slate-300 text-sm">OAB/MS 12.345</p>
                  <div className="flex items-center mt-2">
                    <div className="flex text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-slate-300">5.0 (120+ avaliações)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// Seção Sobre Melhorada
function AboutSection() {
  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection delay={0.2}>
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="font-heading text-4xl font-bold text-slate-900">
                  Experiência que Faz a Diferença
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Com mais de 15 anos de atuação no direito, construí uma carreira sólida baseada na ética, transparência e resultados excepcionais para meus clientes.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 p-3 rounded-lg flex-shrink-0">
                    <Scale className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">Formação Acadêmica</h3>
                    <p className="text-slate-600">Graduado em Direito pela UFMS, com especializações em Direito Civil e Empresarial.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 p-3 rounded-lg flex-shrink-0">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">Reconhecimentos</h3>
                    <p className="text-slate-600">Membro da OAB/MS e diversos prêmios por excelência no atendimento jurídico.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-accent/10 p-3 rounded-lg flex-shrink-0">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">Casos de Sucesso</h3>
                    <p className="text-slate-600">Mais de 500 casos resolvidos com sucesso, sempre priorizando os interesses do cliente.</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-accent">500+</div>
                <div className="text-slate-600">Casos Resolvidos</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-accent">15+</div>
                <div className="text-slate-600">Anos de Experiência</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-accent">98%</div>
                <div className="text-slate-600">Taxa de Sucesso</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-accent">5.0</div>
                <div className="text-slate-600">Avaliação dos Clientes</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

// Seção de Serviços Melhorada
function ServicesSection() {
  const services = [
    { 
      icon: Scale, 
      title: "Direito Civil", 
      description: "Contratos, responsabilidade civil, direito de família e sucessões com abordagem personalizada.",
      features: ["Contratos", "Indenizações", "Divórcios", "Inventários"]
    },
    { 
      icon: Briefcase, 
      title: "Direito Empresarial", 
      description: "Consultoria jurídica para empresas, contratos comerciais e recuperação judicial.",
      features: ["Consultoria", "Contratos", "Recuperação", "Compliance"]
    },
    { 
      icon: Users, 
      title: "Direito do Consumidor", 
      description: "Defesa completa dos seus direitos em relações de consumo e serviços.",
      features: ["Defesa", "Indenizações", "Contratos", "Negociações"]
    },
    { 
      icon: ShieldCheck, 
      title: "Consultoria Preventiva", 
      description: "Análise de riscos e orientação preventiva para evitar litígios futuros.",
      features: ["Prevenção", "Compliance", "Auditoria", "Treinamentos"]
    },
  ];
  
  return (
    <section id="servicos" className="py-20 bg-slate-50">
      <div className="container-custom">
        <AnimatedSection delay={0.2}>
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-slate-900 mb-4">
              Áreas de Especialização
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Oferecemos um portfólio completo de serviços jurídicos especializados, sempre com foco na excelência e nos resultados para nossos clientes.
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <AnimatedSection key={service.title} delay={0.3 + index * 0.1}>
              <Card className="bg-white hover:shadow-xl transition-all duration-300 border-0 h-full group">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-accent/10 p-4 rounded-xl group-hover:bg-accent/20 transition-colors">
                        <service.icon className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="font-semibold text-2xl text-slate-900">{service.title}</h3>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed">{service.description}</p>
                    
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full transition-colors border-slate-300 text-slate-700"
                      onMouseEnter={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.backgroundColor = '#1e293b';
                        target.style.borderColor = '#1e293b';
                        target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.backgroundColor = 'transparent';
                        target.style.borderColor = '#cbd5e1';
                        target.style.color = '#374151';
                      }}
                    >
                      Saiba Mais
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// Seção de Depoimentos
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Empresária",
      content: "Profissional excepcional! Dr. Cássio resolveu meu caso com dedicação e expertise. Recomendo sem hesitar.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Aposentado",
      content: "Atendimento humanizado e resultados surpreendentes. Conseguiu resolver uma questão que arrastava há anos.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Comerciante",
      content: "Transparência e competência definem o trabalho do Dr. Cássio. Estou muito satisfeita com os resultados.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <AnimatedSection delay={0.2}>
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-slate-900 mb-4">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-slate-600">
              A satisfação dos nossos clientes é a nossa maior conquista
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={index} delay={0.3 + index * 0.1}>
              <Card className="bg-slate-50 border-0 h-full">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Quote className="w-8 h-8 text-accent" />
                    <p className="text-slate-700 italic leading-relaxed">"{testimonial.content}"</p>
                    <div className="space-y-2">
                      <div className="flex text-accent">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                        <div className="text-sm text-slate-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// Seção de Contato Melhorada
function ContactSection() {
  return (
    <section id="contato" className="py-20 bg-slate-900 text-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16">
          <AnimatedSection delay={0.2}>
            <div className="space-y-8">
              <div>
                {/* Título em azul escuro quase preto */}
                <h2 className="font-heading text-4xl font-bold mb-4" style={{color: '#1e293b'}}>
                  Agende Sua Consulta
                </h2>
                {/* Subtítulo em azul escuro quase preto */}
                <p className="text-xl" style={{color: '#334155'}}>
                  Estamos prontos para ouvir seu caso e oferecer a melhor solução jurídica. Entre em contato conosco.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {/* Textos em azul escuro quase preto */}
                    <div className="font-semibold" style={{color: '#1e293b'}}>Telefone / WhatsApp</div>
                    <div style={{color: '#334155'}}>(67) 99644-9627</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {/* Textos em azul escuro quase preto */}
                    <div className="font-semibold" style={{color: '#1e293b'}}>E-mail</div>
                    <div style={{color: '#334155'}}>contato@cassiomiguel.adv.br</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {/* Textos em azul escuro quase preto */}
                    <div className="font-semibold" style={{color: '#1e293b'}}>Localização</div>
                    <div style={{color: '#334155'}}>Campo Grande, MS</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {/* Textos em azul escuro quase preto */}
                    <div className="font-semibold" style={{color: '#1e293b'}}>Horário de Atendimento</div>
                    <div style={{color: '#334155'}}>Segunda a Sexta: 8h às 18h</div>
                    <div style={{color: '#334155'}}>WhatsApp: 24h</div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.4}>
            <Card className="bg-white">
              <CardContent className="p-8">
                <ContactForm />
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// Componente principal da página
export default function HomePage() {
  return (
    <>
      <Header />
      <HeroModern />
      <AboutSection />
      <ServicesSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </>
  )
}