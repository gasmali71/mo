import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, User, LogIn, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import { checkAdminAccess } from '@/lib/admin';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const hasAccess = await checkAdminAccess(user.id);
        setIsAdmin(hasAccess);
      }
    }
    checkAdmin();
  }, [user]);

  async function handleLogout() {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <Brain className="h-8 w-8 text-primary transition-colors duration-300 group-hover:text-secondary" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NeuronalFit
              </span>
            </Link>

            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/test"
                className="nav-link inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary"
              >
                Évaluation
              </Link>
              <Link
                to="/reports"
                className="nav-link inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary"
              >
                Rapports
              </Link>
              <Link
                to="/pricing"
                className="nav-link inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-primary"
              >
                Tarifs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Mon compte
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin/system-status">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Administration
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="outline" className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button className="bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
