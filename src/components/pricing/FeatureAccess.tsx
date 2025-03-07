import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkFeatureAccess } from '@/lib/stripe';
import { Link } from 'react-router-dom';

interface FeatureAccessProps {
  feature: string;
  children: React.ReactNode;
}

export function FeatureAccess({ feature, children }: FeatureAccessProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const access = await checkFeatureAccess(feature);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [feature]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Fonctionnalité Premium
        </h3>
        <p className="text-blue-700 mb-4">
          Cette fonctionnalité nécessite un abonnement Premium pour être utilisée.
        </p>
        <Link to="/pricing">
          <Button className="bg-gradient-to-r from-primary to-secondary">
            Voir les offres
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
