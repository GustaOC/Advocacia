// app/login/page.tsx
import LoginForm from "@/components/login-form"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </Suspense>
  )
}