import { useState } from 'react';
import { Settings as SettingsIcon, Users, Activity, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/admin';

interface AdminSettings {
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  auditLogRetention: number;
}

export function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    allowNewRegistrations: true,
    requireEmailVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    auditLogRetention: 30
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSave() {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          settings: settings,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await logAdminAction(user.id, 'update_settings', settings);

      setMessage({
        type: 'success',
        text: 'Paramètres enregistrés avec succès'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Erreur lors de l\'enregistrement des paramètres'
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Paramètres d'Administration
        </h1>
        <p className="mt-2 text-gray-600">
          Configuration des paramètres système et de sécurité
        </p>
      </div>

      <div className="grid gap-6">
        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Sécurité</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    allowNewRegistrations: e.target.checked
                  }))}
                  className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="ml-2">Autoriser les nouvelles inscriptions</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    requireEmailVerification: e.target.checked
                  }))}
                  className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="ml-2">Exiger la vérification de l'email</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tentatives de connexion maximales
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxLoginAttempts: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Sessions</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Délai d'expiration de session (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionTimeout: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Audit Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Audit</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Conservation des logs d'audit (jours)
              </label>
              <input
                type="number"
                value={settings.auditLogRetention}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  auditLogRetention: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {saving ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
