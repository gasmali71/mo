import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkAdminAccess } from '@/lib/admin';
import { AlertCircle } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  requiredRole?: 'read_only' | 'manager' | 'super_admin';
}

export function AdminGuard({ children, requiredRole }: AdminGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      if (!user) {
        navigate('/auth/login');
        return;
      }

      try {
        const hasAccess = await checkAdminAccess(user.id, requiredRole);
        if (!hasAccess) {
          setError('Accès non autorisé');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        setError('Erreur lors de la vérification des accès');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    }

    verifyAccess();
  }, [user, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
