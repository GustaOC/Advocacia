import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    // ✅ CORREÇÃO: Removido '-DEFAULT' da classe de cor
    <footer className="bg-brand text-primary-foreground">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-semibold text-lg mb-4">Cássio Miguel Advocacia</h3>
            <p className="text-sm text-primary-foreground/80">Assessoria jurídica completa e personalizada para proteger seus interesses.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="#servicos" className="hover:underline">Serviços</Link></li>
              <li><Link href="#sobre" className="hover:underline">Sobre</Link></li>
              <li><Link href="#contato" className="hover:underline">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Contato</h3>
            <address className="space-y-3 text-sm not-italic text-primary-foreground/80">
              <p className="flex items-center justify-center md:justify-start gap-2"><MapPin className="h-4 w-4"/> Campo Grande, MS</p>
              <p className="flex items-center justify-center md:justify-start gap-2"><Phone className="h-4 w-4"/> (67) 99644-9627</p>
              <p className="flex items-center justify-center md:justify-start gap-2"><Mail className="h-4 w-4"/> contato@cassiomiguel.adv.br</p>
            </address>
          </div>
        </div>
        <div className="mt-12 border-t border-primary-foreground/10 pt-8 text-center text-xs text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Cássio Miguel Advocacia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}