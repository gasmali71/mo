import { useState } from 'react';
import { FileText, Download, Share2, Settings, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { AnalysisReport } from '@/components/reports/AnalysisReport';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFReport } from '@/components/reports/PDFReport';

interface Report {
  id: string;
  date: Date;
  title: string;
  type: string;
  score: number;
  report: any;
  student: {
    name: string;
    age: number;
    class: string;
    id: string;
  };
}

// Using a valid UUID for testing
const MOCK_STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';

const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    date: new Date(2024, 2, 15),
    title: 'Évaluation Complète - Mars 2024',
    type: 'Complet',
    score: 75,
    report: {
      testScores: [
        {
          title: 'Inhibition',
          totalScore: 24,
          maxScore: 30,
          average: 2.4,
          level: 'Élevé',
          distribution: { jamais: 1, parfois: 2, souvent: 4, tresSouvent: 3 }
        },
        {
          title: 'Flexibilité cognitive',
          totalScore: 21,
          maxScore: 30,
          average: 2.1,
          level: 'Moyen',
          distribution: { jamais: 2, parfois: 3, souvent: 3, tresSouvent: 2 }
        }
      ],
      overallScore: 75,
      overallLevel: 'Bonne maîtrise générale',
      recommendations: [
        'Continuer les exercices de concentration',
        'Maintenir la pratique régulière',
        'Diversifier les activités cognitives'
      ],
      nextEvaluationDate: new Date(2024, 5, 15)
    },
    student: {
      name: 'Emma Martin',
      age: 12,
      class: '6ème A',
      id: MOCK_STUDENT_ID
    }
  }
];

function ReportSettings({ onClose }: { onClose: () => void }) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Paramètres des Rapports
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez vos préférences de rapports et d'évaluation
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          ← Retour aux rapports
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Préférences d'Affichage</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Afficher les graphiques dans les rapports</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Inclure les recommandations détaillées</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Afficher les comparaisons avec les évaluations précédentes</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Format des Rapports PDF</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style de présentation
              </label>
              <select className="w-full border border-gray-200 rounded-lg p-2">
                <option>Classique</option>
                <option>Moderne</option>
                <option>Minimaliste</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Langue par défaut
              </label>
              <select className="w-full border border-gray-200 rounded-lg p-2">
                <option>Français</option>
                <option>English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Recevoir une notification quand un nouveau rapport est disponible</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Recevoir des rappels pour les prochaines évaluations</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Partage et Confidentialité</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autorisation de partage par défaut
              </label>
              <select className="w-full border border-gray-200 rounded-lg p-2">
                <option>Privé</option>
                <option>Équipe pédagogique uniquement</option>
                <option>Tous les intervenants</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-primary" />
                <span className="ml-2">Demander confirmation avant chaque partage</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Reports() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredReports = MOCK_REPORTS.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (showSettings) {
    return <ReportSettings onClose={() => setShowSettings(false)} />;
  }

  if (selectedReport) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2"
          >
            ← Retour aux rapports
          </Button>
          <PDFDownloadLink
            document={
              <PDFReport
                report={selectedReport.report}
                evaluatorName="Dr. Sophie Bernard"
                subjectName={selectedReport.student.name}
                studentInfo={{
                  age: selectedReport.student.age,
                  class: selectedReport.student.class
                }}
                date={selectedReport.date.toISOString()}
                schoolInfo={{
                  name: "NeuronalFit",
                  logoUrl: "https://example.com/logo.png"
                }}
                testResults={[]}
              />
            }
            fileName={`rapport-${selectedReport.student.name}-${formatDate(selectedReport.date)}.pdf`}
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
        <AnalysisReport
          report={selectedReport.report}
          evaluatorName="Dr. Sophie Bernard"
          subjectName={selectedReport.student.name}
          date={selectedReport.date.toISOString()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Rapports d'Évaluation
          </h1>
          <p className="mt-2 text-gray-600">
            Consultez et téléchargez vos rapports détaillés
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="Complet">Complet</option>
            <option value="Mensuel">Mensuel</option>
            <option value="Initial">Initial</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="space-y-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{report.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(report.date)} • Type : {report.type} • 
                      Élève : {report.student.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right mr-8">
                    <div className="font-medium">{report.score}/100</div>
                    <div className="text-sm text-gray-500">Score global</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedReport(report)}
                  >
                    Voir le détail
                  </Button>
                  <PDFDownloadLink
                    document={
                      <PDFReport
                        report={report.report}
                        evaluatorName="Dr. Sophie Bernard"
                        subjectName={report.student.name}
                        studentInfo={{
                          age: report.student.age,
                          class: report.student.class
                        }}
                        date={report.date.toISOString()}
                        schoolInfo={{
                          name: "NeuronalFit",
                          logoUrl: "https://example.com/logo.png"
                        }}
                        testResults={[]}
                      />
                    }
                    fileName={`rapport-${report.student.name}-${formatDate(report.date)}.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={loading}
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    )}
                  </PDFDownloadLink>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Partager
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
