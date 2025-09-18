// hooks/use-auth.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { AuthUser } from '@/lib/auth'; // Reutilizamos a interface do backend

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // Usamos o apiClient para buscar os dados do usuário logado
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("[AuthProvider] Falha ao buscar usuário, provavelmente não está logado.", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  /**
   * Função centralizada para verificar permissões.
   * @param permission - O código da permissão a ser verificada (ex: 'tasks_create').
   * @returns `true` se o usuário tiver a permissão ou for admin, `false` caso contrário.
   */
  const can = (permission: string): boolean => {
    if (!user) {
      return false;
    }
    // Um admin sempre tem permissão
    if (user.role === 'admin') {
      return true;
    }
    // Verifica se a permissão está na lista de permissões do usuário
    return user.permissions?.includes(permission) ?? false;
  };

  const value = { user, isLoading, can };

  // Renderiza um loader global enquanto a sessão do usuário está sendo verificada
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook customizado para acessar o contexto de autenticação.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}