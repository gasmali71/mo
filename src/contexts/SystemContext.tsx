import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { systemMonitor } from '@/lib/system-monitor';
import { virtualAssistant } from '@/lib/virtual-assistant';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface SystemStatus {
  auth: boolean;
  database: boolean;
  stripe: boolean;
  storage: boolean;
}

interface SystemContextType {
  status: SystemStatus;
  contextualHelp: string[];
  suggestions: string[];
  loading: boolean;
  error: string | null;
}

const SystemContext = createContext<SystemContextType>({
  status: {
    auth: false,
    database: false,
    stripe: false,
    storage: false
  },
  contextualHelp: [],
  suggestions: [],
  loading: true,
  error: null
});

export function SystemProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SystemStatus>({
    auth: false,
    database: false,
    stripe: false,
    storage: false
  });
  const [contextualHelp, setContextualHelp] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    async function updateSystemState() {
      try {
        const report = await systemMonitor.getSystemReport();
        setStatus(report.status);

        await virtualAssistant.updateContext({
          user,
          currentPage: location.pathname
        });

        const help = await virtualAssistant.getContextualHelp(location.pathname);
        setContextualHelp(help);

        const newSuggestions = await virtualAssistant.getSuggestions();
        setSuggestions(newSuggestions);
      } catch (err) {
        console.error('Error updating system state:', err);
        setError('Error updating system state');
      } finally {
        setLoading(false);
      }
    }

    updateSystemState();

    // Update system status every minute
    const interval = setInterval(updateSystemState, 60000);

    return () => clearInterval(interval);
  }, [location.pathname, user]);

  return (
    <SystemContext.Provider value={{
      status,
      contextualHelp,
      suggestions,
      loading,
      error
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
