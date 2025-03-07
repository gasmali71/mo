import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL;

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  features: string[];
  trialDays?: number;
}

export const PLANS: Record<string, PlanDetails> = {
  freemium: {
    id: 'freemium',
    name: 'Gratuit',
    price: 0,
    features: [
      '1 test cognitif complet',
      'Rapport PDF basique',
      'Validité 7 jours',
      'Support par email'
    ],
    trialDays: 7
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    features: [
      '10 tests cognitifs complets',
      'Rapports détaillés PDF',
      'Suivi de progression',
      'Recommandations personnalisées',
      'Accès aux exercices essentiels',
      'Support par email',
      'Validité 1 an'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    features: [
      'Tous les avantages Basic +',
      'Tests illimités',
      'Recommandations avancées',
      'Suivi de progression détaillé',
      'Exercices avancés',
      'Support prioritaire',
      'Export des données',
      'Utilisation personnelle uniquement'
    ]
  }
};

export async function createCheckoutSession(planId: string) {
  try {
    const { data: { session } } = await supabase.functions.invoke('create-checkout-session', {
      body: { planId }
    });

    const stripe = await getStripe();
    const result = await stripe?.redirectToCheckout({
      sessionId: session.id
    });

    if (result?.error) {
      throw new Error(result.error.message);
    }

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getSubscriptionStatus() {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', supabase.auth.getUser()?.id)
      .single();

    if (error) throw error;

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return null;
  }
}

export async function checkFeatureAccess(feature: string): Promise<boolean> {
  try {
    const { data: limits, error } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', supabase.auth.getUser()?.id)
      .eq('feature', feature)
      .single();

    if (error) throw error;

    if (!limits) return false;

    // Check if usage limit is exceeded
    if (limits.used_count >= limits.max_count) return false;

    // Check if reset date has passed
    if (limits.reset_date && new Date(limits.reset_date) <= new Date()) {
      // Reset usage count
      await supabase
        .from('usage_limits')
        .update({ used_count: 0, reset_date: null })
        .eq('id', limits.id);
      
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

export async function incrementFeatureUsage(feature: string): Promise<void> {
  try {
    await supabase.rpc('increment_feature_usage', {
      p_feature: feature,
      p_user_id: supabase.auth.getUser()?.id
    });
  } catch (error) {
    console.error('Error incrementing feature usage:', error);
    throw error;
  }
}
