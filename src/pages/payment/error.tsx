import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaymentError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Erreur de paiement
        </h1>
        <p className="text-gray-600 mb-8">
          Une erreur est survenue lors du traitement de votre paiement.
          Veuillez réessayer ou contacter notre support si le problème persiste.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-primary to-secondary group"
          >
            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Retour aux tarifs
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = 'mailto:support@neuronalfit.com'}
            className="w-full"
          >
            Contacter le support
          </Button>
        </div>
      </div>
    </div>
  );
}
