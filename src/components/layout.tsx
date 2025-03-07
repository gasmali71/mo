import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, BarChart3, FileText, Home, CreditCard } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex w-full">
              <Link to="/" className="flex items-center group">
                <Brain className="h-8 w-8 text-primary transition-colors duration-300 group-hover:text-secondary" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  NeuronalFit
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center justify-end flex-1">
                <NavLink to="/" icon={<Home className="h-5 w-5" />}>
                  Accueil
                </NavLink>
                <NavLink to="/test" icon={<Brain className="h-5 w-5" />}>
                  Évaluation
                </NavLink>
                <NavLink to="/dashboard" icon={<BarChart3 className="h-5 w-5" />}>
                  Tableau de bord
                </NavLink>
                <NavLink to="/reports" icon={<FileText className="h-5 w-5" />}>
                  Rapports
                </NavLink>
                <NavLink to="/pricing" icon={<CreditCard className="h-5 w-5" />}>
                  Tarifs
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}

function NavLink({ to, icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`nav-link inline-flex items-center px-1 pt-1 text-sm font-medium ${
        isActive 
          ? 'text-primary' 
          : 'text-gray-700 hover:text-primary'
      }`}
    >
      {icon}
      <span className="ml-2">{children}</span>
    </Link>
  );
}
