import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cássio Miguel Advocacia | Sistema de Gestão',
  description: 'Sistema completo de gestão jurídica para escritórios de advocacia',
  keywords: 'advocacia, gestão jurídica, processos, petições, clientes',
  authors: [{ name: 'Cássio Miguel Advocacia' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Sistema interno
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2C3E50" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html {
              font-family: ${GeistSans.style.fontFamily};
              --font-sans: ${GeistSans.variable};
              --font-mono: ${GeistMono.variable};
            }
            
            /* Cores do sistema */
            :root {
              --primary: #2C3E50;
              --primary-light: #34495E;
              --secondary: #3498DB;
              --success: #2ECC71;
              --warning: #F39C12;
              --danger: #E74C3C;
              --background: #F5F5F5;
              --surface: #FFFFFF;
              --text-primary: #2C3E50;
              --text-secondary: #333333;
              --border: rgba(44, 62, 80, 0.1);
            }
            
            /* Otimizações de performance */
            * {
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              background-color: var(--background);
              color: var(--text-primary);
              line-height: 1.6;
            }
            
            /* Loading states */
            .loading-skeleton {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            
            /* Smooth transitions */
            .transition-smooth {
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `
        }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div id="portal-root" />
        {children}
      </body>
    </html>
  )
}
