import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Wrapper de route privée. Redirige vers /login (replace) si aucun token JWT
 * n'est présent dans le store. Le bootstrap async d'`App` (validation /me) gère
 * l'invalidation : si le token stocké est expiré, le store est purgé et le
 * prochain rendu redirige.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (token === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
