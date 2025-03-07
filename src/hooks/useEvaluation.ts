import { useState, useCallback } from 'react';
import { saveEvaluation, EvaluationData } from '@/lib/api/evaluations';

interface UseEvaluationReturn {
  saveTest: (data: EvaluationData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useEvaluation(): UseEvaluationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTest = useCallback(async (data: EvaluationData) => {
    setLoading(true);
    setError(null);

    try {
      await saveEvaluation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    saveTest,
    loading,
    error
  };
}
