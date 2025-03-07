import { supabase } from './supabase';
import { systemMonitor } from './system-monitor';

interface DatabaseStatus {
  isConnected: boolean;
  lastCheck: Date;
  errorCount: number;
  avgResponseTime: number;
  tables: {
    name: string;
    status: 'healthy' | 'error';
    rowCount?: number;
  }[];
}

class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private status: DatabaseStatus = {
    isConnected: false,
    lastCheck: new Date(),
    errorCount: 0,
    avgResponseTime: 0,
    tables: []
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  private async initialize() {
    await this.checkConnection();
    this.startMonitoring();
  }

  private async checkConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('health_check')
        .select('status')
        .limit(1);

      if (error) throw error;

      // Update status
      this.status.isConnected = true;
      this.status.lastCheck = new Date();
      this.status.avgResponseTime = Date.now() - startTime;

      // Log successful connection
      console.log('Database connection successful:', {
        responseTime: this.status.avgResponseTime,
        timestamp: this.status.lastCheck
      });

      // Check tables status
      await this.checkTablesStatus();

    } catch (error) {
      this.status.isConnected = false;
      this.status.errorCount++;
      
      console.error('Database connection error:', {
        error,
        timestamp: new Date(),
        attemptCount: this.status.errorCount
      });

      // Log to system monitor
      await this.logSystemError('database_connection_error', error);
    }
  }

  private async checkTablesStatus(): Promise<void> {
    const tables = [
      'user_profiles',
      'test_results',
      'evaluations',
      'subscriptions',
      'usage_limits'
    ];

    const tableStatus = await Promise.all(
      tables.map(async (table) => {
        try {
          const startTime = Date.now();
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) throw error;

          return {
            name: table,
            status: 'healthy' as const,
            rowCount: count,
            responseTime: Date.now() - startTime
          };
        } catch (error) {
          console.error(`Error checking table ${table}:`, error);
          return {
            name: table,
            status: 'error' as const
          };
        }
      })
    );

    this.status.tables = tableStatus;
  }

  private async logSystemError(type: string, error: any): Promise<void> {
    try {
      await supabase
        .from('system_logs')
        .insert({
          component: 'database',
          status: 'error',
          details: {
            type,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Error logging to system_logs:', logError);
    }
  }

  private startMonitoring(): void {
    // Check connection every 30 seconds
    setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  public async getDiagnosticReport(): Promise<{
    status: DatabaseStatus;
    recommendations: string[];
  }> {
    await this.checkConnection();

    const recommendations: string[] = [];

    // Generate recommendations based on status
    if (!this.status.isConnected) {
      recommendations.push('Vérifiez les credentials de connexion à la base de données');
      recommendations.push('Assurez-vous que la base de données est accessible');
    }

    if (this.status.errorCount > 0) {
      recommendations.push('Surveillez les logs pour identifier les erreurs récurrentes');
    }

    if (this.status.avgResponseTime > 1000) {
      recommendations.push('Les temps de réponse sont élevés, optimisation recommandée');
    }

    // Check table health
    const unhealthyTables = this.status.tables.filter(t => t.status === 'error');
    if (unhealthyTables.length > 0) {
      recommendations.push(
        `Vérifiez l'état des tables: ${unhealthyTables.map(t => t.name).join(', ')}`
      );
    }

    return {
      status: { ...this.status },
      recommendations
    };
  }

  public async testCRUDOperations(): Promise<{
    success: boolean;
    operations: Record<string, boolean>;
    errors?: Record<string, string>;
  }> {
    const operations: Record<string, boolean> = {
      select: false,
      insert: false,
      update: false,
      delete: false
    };
    const errors: Record<string, string> = {};

    try {
      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);

      operations.select = !selectError;
      if (selectError) errors.select = selectError.message;

      // Test INSERT
      const { data: insertData, error: insertError } = await supabase
        .from('health_check')
        .insert({
          status: 'test',
          details: { test: true }
        })
        .select()
        .single();

      operations.insert = !insertError;
      if (insertError) errors.insert = insertError.message;

      // Test UPDATE (if insert succeeded)
      if (insertData) {
        const { error: updateError } = await supabase
          .from('health_check')
          .update({ status: 'updated' })
          .eq('id', insertData.id);

        operations.update = !updateError;
        if (updateError) errors.update = updateError.message;

        // Test DELETE
        const { error: deleteError } = await supabase
          .from('health_check')
          .delete()
          .eq('id', insertData.id);

        operations.delete = !deleteError;
        if (deleteError) errors.delete = deleteError.message;
      }

      return {
        success: Object.values(operations).every(op => op),
        operations,
        errors: Object.keys(errors).length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Error during CRUD test:', error);
      return {
        success: false,
        operations,
        errors: {
          general: error.message
        }
      };
    }
  }
}

export const databaseMonitor = DatabaseMonitor.getInstance();
