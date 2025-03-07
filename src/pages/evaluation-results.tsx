import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Brain, Download, Share2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEvaluationById } from '@/lib/api/evaluations';
import { saveTestResult } from '@/lib/api/testResults';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from '@/components/reports/PDFReport';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

interface EvaluationResult {
  categoryScores: {
    category: string;
    score: number;
    maxScore: number;
    level: string;
    strengths: string[];
    improvements: string[];
  }[];
  overallScore: number;
  performanceLevel: string;
  recommendations: string[];
  date: Date;
}

export function EvaluationResults() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!sessionId) {
        setError('ID de session manquant');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching evaluation results for session:', sessionId);
        const evaluation = await getEvaluationById(sessionId);
        console.log('Received evaluation data:', evaluation);

        // Transform evaluation data into the expected format
        const transformedResult: EvaluationResult = {
          categoryScores: Object.entries(evaluation.detailed_results.categoryScores || {}).map(([category, data]: [string, any]) => ({
            category,
            score: data.score,
            maxScore: data.maxScore,
            level: data.level,
            strengths: data.strengths || [],
            improvements: data.improvements || []
          })),
          overallScore: evaluation.score,
          performanceLevel: evaluation.detailed_results.performanceLevel || 'Non évalué',
          recommendations: evaluation.detailed_results.recommendations || [],
          date: new Date(evaluation.date_completed)
        };

        console.log('Transformed result:', transformedResult);
        setResult(transformedResult);
      } catch (err) {
        console.error('Error fetching evaluation results:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des résultats');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [sessionId]);

  const handleSaveToReports = async () => {
    if (!result || !user) return;

    setSaving(true);
    try {
      console.log('Saving test result:', {
        studentId: user.id,
        testType: 'cognitive',
        score: result.overallScore,
        detailedResults: {
          categoryScores: result.categoryScores,
          recommendations: result.recommendations,
          date: result.date
        }
      });

      await saveTestResult({
        studentId: user.id,
        testType: 'cognitive',
        score: result.overallScore,
        detailedResults: {
          categoryScores: result.categoryScores,
          recommendations: result.recommendations,
          date: result.date
        }
      });

      console.log('Test result saved successfully');
      navigate('/reports');
    } catch (err) {
      console.error('Error saving test result:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-red-700">{error || 'Résultats non disponibles'}</p>
      </div>
    );
  }

  const radarData = {
    labels: result.categoryScores.map(score => score.category),
    datasets: [{
      label: 'Score',
      data: result.categoryScores.map(score => score.score),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(59, 130, 246)'
    }]
  };

  const barData = {
    labels: result.categoryScores.map(score => score.category),
    datasets: [{
      label: 'Score obtenu',
      data: result.categoryScores.map(score => score.score),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Résultats de l'Évaluation
          </h1>
          <p className="mt-2 text-gray-600">
            Complété le {result.date.toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-4">
          <PDFDownloadLink
            document={
              <PDFReport
                report={{
                  testScores: result.categoryScores.map(score => ({
                    title: score.category,
                    totalScore: score.score,
                    maxScore: score.maxScore,
                    level: score.level as any,
                    average: score.score / score.maxScore * 3,
                    distribution: { jamais: 0, parfois: 0, souvent: 0, tresSouvent: 0 }
                  })),
                  overallScore: result.overallScore,
                  overallLevel: result.performanceLevel,
                  recommendations: result.recommendations,
                  nextEvaluationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                }}
                evaluatorName="Système"
                subjectName="Élève"
                studentInfo={{
                  age: 12,
                  class: "6ème"
                }}
                date={result.date.toISOString()}
                schoolInfo={{
                  name: "FlexiMind"
                }}
                testResults={[]}
              />
            }
            fileName={`evaluation-${result.date.toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                {loading ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            )}
          </PDFDownloadLink>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {/* Implement sharing logic */}}
          >
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Brain className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Score Global</h3>
          <p className="mt-2 text-2xl font-semibold">{result.overallScore}%</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Niveau</h3>
          <p className="mt-2 text-2xl font-semibold">{result.performanceLevel}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            {result.categoryScores.filter(score => score.level === 'Excellent').length}
          </div>
          <h3 className="text-sm font-medium text-gray-500">Points Forts</h3>
          <p className="mt-2 text-2xl font-semibold">Excellents</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4">
            {result.categoryScores.filter(score => score.level === 'Moyen').length}
          </div>
          <h3 className="text-sm font-medium text-gray-500">À Améliorer</h3>
          <p className="mt-2 text-2xl font-semibold">Catégories</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Profil de Compétences</h3>
          <Radar data={radarData} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Scores par Catégorie</h3>
          <Bar data={barData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Analyse Détaillée</h3>
          <div className="space-y-6">
            {result.categoryScores.map((score, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{score.category}</h4>
                  <span className={`font-medium ${
                    score.score >= 85 ? 'text-green-600' :
                    score.score >= 70 ? 'text-blue-600' :
                    score.score >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {score.score}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-green-600">Points forts :</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {score.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Axes d'amélioration :</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {score.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
            <ul className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-gray-600">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Prochaines Étapes</h3>
            <div className="space-y-4">
              <Button
                onClick={handleSaveToReports}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-secondary group"
              >
                {saving ? 'Enregistrement...' : 'Sauvegarder dans les rapports'}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
