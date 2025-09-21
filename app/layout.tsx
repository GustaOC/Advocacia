import type { Metadata, Viewport } from 'next'
import { Lato, Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Toaster } from "@/components/ui/toaster"

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
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
  themeColor: '#0f1724',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${lato.variable} ${poppins.variable} scroll-smooth`}>
      <body className="bg-background text-foreground">
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}