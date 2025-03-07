import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanDetails } from '@/lib/stripe';
import { Link } from 'react-router-dom';

interface PlanCardProps {
  plan: PlanDetails;
  isPopular?: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  currentPlan?: string;
}

export function PlanCard({
  plan,
  isPopular,
  onSelect,
  isLoading,
  currentPlan
}: PlanCardProps) {
  const isCurrentPlan = currentPlan === plan.id;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
          Recommandé
        </div>
      )}
      <div className="p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-500 mb-6">
          {plan.id === 'freemium' ? 'Essai gratuit' : 'Accès complet'}
        </p>
        <div className="flex items-baseline mb-8">
          <span className="text-4xl font-bold">{plan.price}€</span>
          <span className="text-gray-500 ml-2">
            {plan.id === 'freemium' ? 'gratuit' : '/mois'}
          </span>
        </div>
        {plan.trialDays && (
          <p className="text-sm text-primary mb-4">
            {plan.trialDays} jours d'essai gratuit
          </p>
        )}
        <Link 
          to={`/auth/signup?plan=${plan.id}`}
          className="block w-full"
        >
          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary"
            disabled={isLoading || isCurrentPlan}
          >
            {isLoading ? 'Chargement...' : 
             isCurrentPlan ? 'Plan actuel' :
             plan.id === 'freemium' ? 'Commencer gratuitement' : 'Choisir ce plan'}
          </Button>
        </Link>
      </div>
      <div className="px-8 pb-8">
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
