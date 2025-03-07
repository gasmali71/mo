import { BarChart3, TrendingUp, Brain, Calendar } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

const MOCK_DATA = {
  lastTestDate: new Date(2024, 2, 15),
  totalTests: 3,
  averageScore: 75,
  progress: [
    { date: '15/03/2024', score: 75 },
    { date: '01/03/2024', score: 70 },
    { date: '15/02/2024', score: 65 },
  ],
};

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Tableau de Bord
        </h1>
        <p className="mt-2 text-gray-600">
          Suivez vos progrès et consultez vos performances
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-md p-6 card-hover">
          <Calendar className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Dernier test</h3>
          <p className="mt-2 text-2xl font-semibold">
            {formatDate(MOCK_DATA.lastTestDate)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 card-hover">
          <Brain className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Tests complétés</h3>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(MOCK_DATA.totalTests)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 card-hover">
          <BarChart3 className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Score moyen</h3>
          <p className="mt-2 text-2xl font-semibold">
            {MOCK_DATA.averageScore}/100
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 card-hover">
          <TrendingUp className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-sm font-medium text-gray-500">Progression</h3>
          <p className="mt-2 text-2xl font-semibold text-green-600">+15%</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Historique des scores</h2>
          <div className="space-y-4">
            {MOCK_DATA.progress.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{entry.date}</span>
                <div className="flex items-center">
                  <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${entry.score}%` }}
                    />
                  </div>
                  <span className="ml-4 font-medium">{entry.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Prochaine évaluation</h2>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-gray-600">
              Recommandée dans 2 semaines
            </p>
            <button className="mt-4 text-primary hover:text-primary/80 font-medium">
              Planifier maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
