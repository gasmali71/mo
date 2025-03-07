import { useEffect } from 'react';
import { useEvaluation } from '@/hooks/useEvaluation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';

interface TestCompletionProps {
  studentId: string;
  testType: string;
  score: number;
  detailedResults: Record<string, any>;
  onComplete: () => void;
}

export function TestCompletion({
  studentId,
  testType,
  score,
  detailedResults,
  onComplete
}: TestCompletionProps) {
  const navigate = useNavigate();
  const { saveTest, loading, error } = useEvaluation();

  useEffect(() => {
    async function saveTestResults() {
      try {
        await saveTest({
          studentId,
          testType,
          score,
          detailedResults
        });
        onComplete();
      } catch (err) {
        console.error('Error saving test results:', err);
      }
    }

    saveTestResults();
  }, [studentId, testType, score, detailedResults, saveTest, onComplete]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Enregistrement des résultats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-8 space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Test complété avec succès !
        </h3>
        <p className="text-green-700">
          Score global : {score}%
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2"
        >
          <FileText className="h-5 w-5" />
          Voir le rapport détaillé
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
