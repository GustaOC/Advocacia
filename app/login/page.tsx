// app/login/page.tsx
import LoginForm from "@/components/login-form"
import { Suspense } from "react"

function LoginPageContent() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-radial-top" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}