// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectMap: Record<string, string> = {
      student:   '/student/dashboard',
      company:   '/company/dashboard',
      admin:     '/admin/dashboard',
      institution: '/institution/dashboard',
      'sub-admin': '/sub-admin/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/auth'} replace />;
  }

  return <>{children}</>;
}