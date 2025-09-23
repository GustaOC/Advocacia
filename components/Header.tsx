// components/Header.tsx 
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Phone, MessageCircle } from 'lucide-react'
import { Button } from './ui/button'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detecta scroll para mudar aparência do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const menuItems = [
    { href: '#sobre', label: 'Sobre' },
    { href: '#servicos', label: 'Áreas de Atuação' },
    { href: '#contato', label: 'Contato' }
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleWhatsApp = () => {
    window.open('https://wa.me/5567996449627?text=Olá! Gostaria de agendar uma consulta jurídica.', '_blank')
  }

  const handleCall = () => {
    window.open('tel:+5567996449627', '_self')
  }

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="container-custom">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="Página Inicial Cássio Miguel Advocacia"
            >
              <div className="relative w-44 h-12 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Cássio Miguel Advocacia Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Menu Desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors hover:text-accent relative group ${
                    isScrolled ? 'text-slate-700' : 'text-white'
                  }`}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            {/* Botões de Ação Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCall}
                className={`${
                  isScrolled
                    ? 'text-slate-700 hover:text-accent hover:bg-accent/10'
                    : 'text-white hover:text-accent hover:bg-white/10'
                } transition-colors`}
              >
                <Phone className="h-4 w-4 mr-2" />
                (67) 99644-9627
              </Button>
              
              <Button
                asChild
                className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#1e293b', color: 'white' }}
              >
                <Link href="/login">
                  Área administrativa
                </Link>
              </Button>
            </div>

            {/* Botão Menu Mobile */}
            <Button
              variant="ghost"
              className={`lg:hidden p-2 ${
                isScrolled ? 'text-slate-700' : 'text-white'
              }`}
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu de navegação"}
            >
              {isMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={toggleMenu}
        ></div>
        
        {/* Menu Content */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header do Menu */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="relative w-36 h-10">
                <Image
                  src="/logo.png"
                  alt="Cássio Miguel Advocacia"
                  fill
                  className="object-contain"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={toggleMenu}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-8">
              <div className="space-y-6">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-lg font-medium text-slate-700 hover:text-accent transition-colors py-2"
                    onClick={toggleMenu}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <hr className="border-slate-200" />
                
                {/* Informações de Contato */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Contato Direto</h3>
                  
                  <button
                    onClick={() => {handleCall(); toggleMenu();}}
                    className="flex items-center w-full text-left text-slate-700 hover:text-accent transition-colors py-2"
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">(67) 99644-9627</div>
                      <div className="text-sm text-slate-500">Toque para ligar</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {handleWhatsApp(); toggleMenu();}}
                    className="flex items-center w-full text-left text-green-600 hover:text-green-700 transition-colors py-2"
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-sm text-slate-500">Atendimento 24h</div>
                    </div>
                  </button>
                </div>
              </div>
            </nav>
            
            {/* Footer do Menu */}
            <div className="p-6 border-t border-slate-200 space-y-3">
              <Button
                asChild
                className="w-full font-semibold"
                style={{ backgroundColor: '#1e293b', color: 'white' }}
              >
                <Link href="/login" onClick={toggleMenu}>
                  Área administrativa
                </Link>
              </Button>
              
              <div className="text-center text-sm text-slate-500">
                <div>Campo Grande, MS</div>
                <div>Atendimento 24h via WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer para compensar header fixed */}
      <div className="h-20"></div>
    </>
  )
}