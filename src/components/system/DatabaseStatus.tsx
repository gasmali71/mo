import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { databaseMonitor } from '@/lib/database-monitor';

export function DatabaseStatus() {
  const [loading, setLoading] = useState(true);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [crudStatus, setCrudStatus] = useState<any>(null);

  async function runDiagnostic() {
    setLoading(true);
    try {
      const report = await databaseMonitor.getDiagnosticReport();
      const crud = await databaseMonitor.testCRUDOperations();
      
      setDiagnosticReport(report);
      setCrudStatus(crud);
    } catch (error) {
      console.error('Error running diagnostic:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runDiagnostic();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          État de la Base de Données
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostic}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            {diagnosticReport.status.isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <h3 className="font-medium">Connexion</h3>
          </div>
          <p className="text-sm text-gray-600">
            Dernier check: {new Date(diagnosticReport.status.lastCheck).toLocaleTimeString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-2">Temps de réponse</h3>
          <p className="text-sm text-gray-600">
            {diagnosticReport.status.avgResponseTime}ms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-2">Erreurs</h3>
          <p className="text-sm text-gray-600">
            {diagnosticReport.status.errorCount} détectées
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-2">Tables</h3>
          <p className="text-sm text-gray-600">
            {diagnosticReport.status.tables.filter(t => t.status === 'healthy').length}/
            {diagnosticReport.status.tables.length} en bon état
          </p>
        </div>
      </div>

      {/* CRUD Operations Status */}
      {crudStatus && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Test des Opérations CRUD</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(crudStatus.operations).map(([op, success]) => (
              <div key={op} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="capitalize">{op}</span>
                {success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
          {crudStatus.errors && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-700 mb-2">Erreurs détectées</h4>
              <ul className="space-y-1">
                {Object.entries(crudStatus.errors).map(([op, error]) => (
                  <li key={op} className="text-sm text-red-600">
                    {op}: {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {diagnosticReport.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Recommandations</h3>
          <ul className="space-y-2">
            {diagnosticReport.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">État des Tables</h3>
        <div className="space-y-4">
          {diagnosticReport.status.tables.map((table: any) => (
            <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">{table.name}</h4>
                {table.rowCount !== undefined && (
                  <p className="text-sm text-gray-600">{table.rowCount} enregistrements</p>
                )}
              </div>
              {table.status === 'healthy' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
