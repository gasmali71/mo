import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS, createCheckoutSession, getSubscriptionStatus } from '@/lib/stripe';
import { PlanCard } from '@/components/pricing/PlanCard';
import { useAuth } from '@/contexts/AuthContext';

export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return;
      try {
        const subscription = await getSubscriptionStatus();
        if (subscription) {
          setCurrentPlan(subscription.plan_type);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    }

    fetchSubscription();
  }, [user]);

  async function handlePlanSelect(planId: string) {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (planId === 'freemium') {
        // Handle freemium signup
        navigate('/dashboard');
        return;
      }

      await createCheckoutSession(planId);
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Tarifs NeuronalFit
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Des solutions adaptées à vos besoins
        </p>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <PlanCard
          plan={PLANS.freemium}
          onSelect={handlePlanSelect}
          isLoading={loading}
          currentPlan={currentPlan}
        />
        <PlanCard
          plan={PLANS.basic}
          onSelect={handlePlanSelect}
          isLoading={loading}
          currentPlan={currentPlan}
        />
        <PlanCard
          plan={PLANS.premium}
          isPopular
          onSelect={handlePlanSelect}
          isLoading={loading}
          currentPlan={currentPlan}
        />
      </div>

      <div className="mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-2">
                Quelle formule choisir ?
              </h3>
              <p className="text-gray-600">
                Le forfait Basic est idéal pour une première évaluation. Pour un accès
                complet aux fonctionnalités avancées, optez pour Premium.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Y a-t-il une garantie ?
              </h3>
              <p className="text-gray-600">
                Oui, nous offrons une garantie satisfait ou remboursé de 30 jours
                pour tous nos forfaits.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Les mises à jour sont-elles incluses ?
              </h3>
              <p className="text-gray-600">
                Oui, toutes les mises à jour de votre forfait sont incluses sans
                frais supplémentaires.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Comment fonctionne le paiement ?
              </h3>
              <p className="text-gray-600">
                Le paiement est unique et sécurisé. Vous avez accès à vie aux
                fonctionnalités de votre forfait.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
