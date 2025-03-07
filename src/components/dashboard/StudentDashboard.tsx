import { useState, useEffect } from 'react';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Brain, TrendingUp, Clock, Award, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStudentProgress } from '@/lib/analysis';
import { formatDate } from '@/lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from '../reports/PDFReport';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StudentDashboardProps {
  studentId: string;
  studentName: string;
  studentInfo: {
    age: number;
    class: string;
    photoUrl?: string;
  };
}

export function StudentDashboard({ studentId, studentName, studentInfo }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const progress = await getStudentProgress(studentId);
        setData(progress);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  const latestReport = data.history[0];
  const previousReport = data.history[1];

  const progressData = {
    labels: data.history.map((report: any) => formatDate(new Date(report.date))).reverse(),
    datasets: [{
      label: 'Score global',
      data: data.history.map((report: any) => report.overallScore).reverse(),
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  const radarData = {
    labels: latestReport.testScores.map((score: any) => score.title),
    datasets: [{
      label: 'Dernière évaluation',
      data: latestReport.testScores.map((score: any) => (score.totalScore / score.maxScore) * 100),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgb(59, 130, 246)',
      pointBackgroundColor: 'rgb(59, 130, 246)',
    }]
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de Bord - {studentName}
          </h1>
          <p className="text-gray-600">
            Dernière évaluation : {formatDate(new Date(latestReport.date))}
          </p>
        </div>
        <PDFDownloadLink
          document={
            <PDFReport
              report={latestReport}
              evaluatorName="Évaluateur"
              subjectName={studentName}
              studentInfo={studentInfo}
              date={latestReport.date}
              schoolInfo={{
                name: "FlexiMind Academy",
                logoUrl: "https://example.com/logo.png"
              }}
            />
          }
          fileName={`rapport-${studentName}-${formatDate(new Date(latestReport.date))}.pdf`}
        >
          {({ loading }) => (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              {loading ? 'Génération...' : 'Télécharger le PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Brain className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Score Global</h3>
          <p className="mt-2 text-2xl font-semibold">
            {Math.round(latestReport.overallScore)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <TrendingUp className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Progression</h3>
          <p className={`mt-2 text-2xl font-semibold ${data.progressPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.progressPercentage > 0 ? '+' : ''}{Math.round(data.progressPercentage)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Clock className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Tests Complétés</h3>
          <p className="mt-2 text-2xl font-semibold">
            {data.history.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Award className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Niveau Global</h3>
          <p className="mt-2 text-2xl font-semibold">
            {latestReport.overallLevel}
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Progression</h3>
          <Line
            data={progressData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Profil de Compétences</h3>
          <Radar
            data={radarData}
            options={{
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>

      {/* Résultats détaillés */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Résultats par Domaine</h3>
        <div className="space-y-4">
          {latestReport.testScores.map((score: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">{score.title}</h4>
                <p className="text-sm text-gray-600">
                  Score : {score.totalScore}/{score.maxScore}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  score.level === 'Élevé' ? 'text-green-600' :
                  score.level === 'Moyen' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {score.level}
                </p>
                <p className="text-sm text-gray-600">
                  Moyenne : {score.average.toFixed(1)}/3
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Plan d'Action Personnalisé</h3>
        <ul className="space-y-2">
          {latestReport.recommendations.map((recommendation: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
