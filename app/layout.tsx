import type { Metadata, Viewport } from 'next'
// ✅ Importando a nova fonte 'Lora' e removendo a 'Dancing_Script'
import { Lato, Poppins, Lora } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from "@/components/ui/toaster"

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

// ✅ Configurando a nova fonte serifada para destaque
const lora = Lora({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cássio Miguel Advocacia | Assessoria Jurídica em Campo Grande/MS',
  description: 'Assessoria jurídica especializada em direito civil e empresarial. Atendimento personalizado em Campo Grande — soluções práticas e seguras para pessoas e empresas.',
  keywords: 'advocacia, advogado, campo grande, direito civil, direito empresarial',
  authors: [{ name: 'Cássio Miguel Advocacia' }],
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06213a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // ✅ Adicionando a variável da nova fonte ao HTML
    <html lang="pt-BR" className={`${lato.variable} ${poppins.variable} ${lora.variable} scroll-smooth`}>
      <body className="bg-background text-foreground">
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}