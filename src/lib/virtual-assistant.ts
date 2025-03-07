import { systemMonitor } from './system-monitor';
import { getCurrentUser, getUserProfile } from './auth';
import type { User } from '@supabase/supabase-js';

interface AssistantContext {
  user: User | null;
  currentPage: string;
  systemStatus: any;
  userProfile: any;
}

class VirtualAssistant {
  private static instance: VirtualAssistant;
  private context: AssistantContext = {
    user: null,
    currentPage: '/',
    systemStatus: null,
    userProfile: null
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): VirtualAssistant {
    if (!VirtualAssistant.instance) {
      VirtualAssistant.instance = new VirtualAssistant();
    }
    return VirtualAssistant.instance;
  }

  private async initialize() {
    try {
      const user = await getCurrentUser();
      this.context.user = user;

      if (user) {
        this.context.userProfile = await getUserProfile(user.id);
      }

      this.context.systemStatus = await systemMonitor.getSystemReport();
    } catch (error) {
      console.error('Error initializing virtual assistant:', error);
    }
  }

  public async updateContext(updates: Partial<AssistantContext>) {
    this.context = { ...this.context, ...updates };
    
    if (updates.user) {
      try {
        this.context.userProfile = await getUserProfile(updates.user.id);
      } catch (error) {
        console.error('Error updating user profile in context:', error);
      }
    }
  }

  public async getContextualHelp(page: string): Promise<string[]> {
    const help: string[] = [];
    const { user, userProfile } = this.context;

    switch (page) {
      case '/':
        help.push('Bienvenue sur NeuronalFit ! Commencez par explorer nos services.');
        if (!user) {
          help.push('Inscrivez-vous pour accéder à toutes les fonctionnalités.');
        }
        break;

      case '/test':
        if (!user) {
          help.push('Connectez-vous pour commencer une évaluation.');
        } else {
          const canTest = await this.checkFeatureAccess('test');
          if (canTest) {
            help.push('Vous pouvez commencer une nouvelle évaluation.');
          } else {
            help.push('Vous avez atteint votre limite d\'évaluations. Passez à un forfait supérieur pour continuer.');
          }
        }
        break;

      case '/dashboard':
        if (user && userProfile) {
          help.push(`Bienvenue ${userProfile.full_name} ! Voici vos derniers résultats.`);
          if (userProfile.plan_type === 'freemium') {
            help.push('Passez à un forfait payant pour accéder à plus de fonctionnalités.');
          }
        }
        break;

      case '/reports':
        if (user && userProfile) {
          const canAccessReports = await this.checkFeatureAccess('report_basic');
          if (canAccessReports) {
            help.push('Consultez vos rapports détaillés ici.');
          } else {
            help.push('Mettez à niveau votre abonnement pour accéder aux rapports détaillés.');
          }
        }
        break;
    }

    return help;
  }

  private async checkFeatureAccess(feature: string): Promise<boolean> {
    if (!this.context.user) return false;

    try {
      const { data: limits } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', this.context.user.id)
        .eq('feature', feature)
        .single();

      if (!limits) return false;

      return limits.max_count === -1 || limits.used_count < limits.max_count;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  public async getSystemStatus(): Promise<string[]> {
    const status = await systemMonitor.getSystemReport();
    const messages: string[] = [];

    for (const [service, isActive] of Object.entries(status.status)) {
      if (!isActive) {
        messages.push(`Le service ${service} rencontre actuellement des difficultés.`);
      }
    }

    return messages.length ? messages : ['Tous les systèmes fonctionnent normalement.'];
  }

  public async getSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const { user, userProfile } = this.context;

    if (!user) {
      suggestions.push('Créez un compte pour accéder à toutes les fonctionnalités.');
      return suggestions;
    }

    if (userProfile) {
      const { plan_type, subscriptions } = userProfile;

      if (plan_type === 'freemium') {
        suggestions.push('Découvrez nos forfaits premium pour des fonctionnalités avancées.');
      }

      if (subscriptions?.status === 'active' && subscriptions?.end_date) {
        const endDate = new Date(subscriptions.end_date);
        if (endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
          suggestions.push('Votre abonnement expire bientôt. Pensez à le renouveler !');
        }
      }
    }

    return suggestions;
  }
}

export const virtualAssistant = VirtualAssistant.getInstance();
