import { DatabaseStatus } from '@/components/system/DatabaseStatus';
import { Activity } from 'lucide-react';

export function SystemStatus() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
          <Activity className="h-8 w-8" />
          État du Système
        </h1>
        <p className="mt-2 text-gray-600">
          Surveillance en temps réel des composants système
        </p>
      </div>

      <div className="space-y-8">
        <DatabaseStatus />
      </div>
    </div>
  );
}
