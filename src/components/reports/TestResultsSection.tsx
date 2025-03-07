import { useEffect, useState } from 'react';
import { getStudentTestResults, TestResult } from '@/lib/api/testResults';
import { formatDate } from '@/lib/utils';
import { TestResultsChart } from './TestResultsChart';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';

interface TestResultsSectionProps {
  studentId: string;
}

export function TestResultsSection({ studentId }: TestResultsSectionProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Validation de l'UUID
        if (!studentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
          throw new Error('ID étudiant invalide');
        }

        const data = await getStudentTestResults(studentId);
        setResults(data);
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des résultats');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Aucun résultat de test disponible</p>
      </div>
    );
  }

  const latestResult = results[0];
  const previousResult = results[1];
  const progress = previousResult
    ? ((latestResult.score - previousResult.score) / previousResult.score) * 100
    : 0;

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-semibold">Historique des Évaluations</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Dernier Score</h3>
          <div className="text-2xl font-semibold text-primary">
            {latestResult.score}%
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(new Date(latestResult.completed_at))}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Progression</h3>
          <div className={`text-2xl font-semibold ${progress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {progress > 0 ? '+' : ''}{progress.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Depuis la dernière évaluation
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tests</h3>
          <div className="text-2xl font-semibold text-primary">
            {results.length}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Évaluations complétées
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TestResultsChart results={results} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Détails par Catégorie</h3>
          <div className="space-y-4">
            {Object.entries(latestResult.detailed_results).map(([category, score]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-600">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="font-medium min-w-[3ch]">{score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Historique Complet</h3>
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{result.test_type}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(new Date(result.completed_at))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">{result.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
