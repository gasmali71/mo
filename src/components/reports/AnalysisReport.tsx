import { AnalysisReport as AnalysisReportType, TestScore, formatDate } from '@/lib/analysis';
import { ResultsChart } from './ResultsChart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface AnalysisReportProps {
  report: AnalysisReportType;
  evaluatorName: string;
  subjectName: string;
  date: string;
}

function getLevelColor(level: TestScore['level']): string {
  switch (level) {
    case 'Faible':
      return 'text-red-600';
    case 'Moyen':
      return 'text-yellow-600';
    case 'Élevé':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

export function AnalysisReport({ report, evaluatorName, subjectName, date }: AnalysisReportProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Rapport d'Évaluation
          </h2>
          <p className="text-gray-600">
            {formatDate(new Date(date))}
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => {/* TODO: Implement PDF download */}}
        >
          <Download className="h-4 w-4" />
          Télécharger le PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Évaluateur</p>
            <p className="font-medium">{evaluatorName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Personne évaluée</p>
            <p className="font-medium">{subjectName}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Score Global</h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">
              {Math.round(report.overallScore)}%
            </div>
            <div className="text-gray-600">
              {report.overallLevel}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ResultsChart testScores={report.testScores} />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Résultats détaillés</h3>
            <div className="grid gap-4">
              {report.testScores.map((score, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{score.title}</h4>
                    <span className={`font-medium ${getLevelColor(score.level)}`}>
                      {score.level}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Score</p>
                      <p className="font-medium">{score.totalScore}/{score.maxScore}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Moyenne</p>
                      <p className="font-medium">{score.average.toFixed(1)}/3</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Distribution des réponses</p>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Jamais</div>
                        <div className="font-medium">{score.distribution.jamais}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Parfois</div>
                        <div className="font-medium">{score.distribution.parfois}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Souvent</div>
                        <div className="font-medium">{score.distribution.souvent}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Très souvent</div>
                        <div className="font-medium">{score.distribution.tresSouvent}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Prochaine évaluation</h3>
            <p className="text-gray-600">
              Recommandée le {formatDate(report.nextEvaluationDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
