// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Role } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard
    const redirectMap: Record<Role, string> = {
      student: '/student/dashboard',
      company: '/company/dashboard',
      admin: '/admin/dashboard',
      institution: '/institute/dashboard',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  return <>{children}</>;
}
