// app/dashboard/layout.tsx
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/auth-guard";
import { QueryProvider } from "@/components/query-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <QueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryProvider>
    </AuthGuard>
  );
}