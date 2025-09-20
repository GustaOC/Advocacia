// components/Header.tsx - VERSÃO COM MELHORIA DE ACESSIBILIDADE
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial Cássio Miguel Advocacia">
          <div className="relative w-36 h-10">
            <Image 
              src="/logo.png" 
              alt="Cássio Miguel Advocacia Logo" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
          <Link href="#servicos" className="transition-colors hover:text-foreground">Serviços</Link>
          <Link href="#sobre" className="transition-colors hover:text-foreground">Sobre</Link>
          <Link href="#contato" className="transition-colors hover:text-foreground">Contato</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-transform hover:scale-[1.02]">
            <Link href="/login">Área do Cliente</Link>
          </Button>
          {/* ==> PASSO 10: ADICIONADO ARIA-LABEL <== */}
          <Button variant="ghost" className="md:hidden p-2" aria-label="Abrir menu de navegação">
            <Menu className="h-6 w-6"/>
          </Button>
          {/* ==> FIM DO PASSO 10 <== */}
        </div>
      </div>
    </header>
  )
}