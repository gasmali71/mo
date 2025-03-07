import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signUp } from '@/lib/auth';
import { PLANS } from '@/lib/stripe';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      'Le mot de passe doit contenir au moins une majuscule, un chiffre et un caractère spécial'
    ),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  planType: z.enum(['freemium', 'basic', 'premium'])
});

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') ?? 'freemium';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    planType: selectedPlan as 'freemium' | 'basic' | 'premium'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const validatedData = signupSchema.parse(formData);
      
      await signUp(validatedData.email, validatedData.password, {
        full_name: validatedData.fullName,
        plan_type: validatedData.planType
      });

      if (validatedData.planType === 'freemium') {
        navigate('/dashboard');
      } else {
        navigate('/payment/checkout', { 
          state: { 
            plan: validatedData.planType,
            email: validatedData.email
          }
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Créer un compte
          </h2>
          <p className="mt-2 text-gray-600">
            Rejoignez NeuronalFit pour commencer votre parcours
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="exemple@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Minimum 8 caractères, une majuscule, un chiffre et un caractère spécial
              </p>
            </div>

            <div>
              <label htmlFor="planType" className="block text-sm font-medium text-gray-700">
                Plan sélectionné
              </label>
              <div className="mt-2 space-y-2">
                {Object.entries(PLANS).map(([id, plan]) => (
                  <label key={id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="planType"
                      value={id}
                      checked={formData.planType === id}
                      onChange={(e) => setFormData({ ...formData, planType: e.target.value as 'freemium' | 'basic' | 'premium' })}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <div className="ml-3">
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.price}€ {id === 'freemium' ? '(gratuit)' : '/mois'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary group"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <>
                Créer mon compte
                <UserPlus className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Déjà inscrit ?{' '}
            <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
