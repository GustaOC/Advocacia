// app/dashboard/page.tsx
import { Dashboard } from "@/components/dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}