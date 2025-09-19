'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

export default function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <Button 
        size="lg" 
        variant="primary" 
        onClick={() => window.open('https://wa.me/5567996449627', '_blank')}
      >
        <MessageCircle className="mr-2 h-5 w-5" /> Agendar Consulta
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="#servicos">Nossos Serviços</Link>
      </Button>
    </div>
  )
}