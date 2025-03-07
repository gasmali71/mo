import { supabase } from './supabase';

interface SystemStatus {
  auth: boolean;
  database: boolean;
  stripe: boolean;
  storage: boolean;
}

interface ServiceMetrics {
  responseTime: number;
  errorRate: number;
  uptime: number;
}

class SystemMonitor {
  private static instance: SystemMonitor;
  private status: SystemStatus = {
    auth: false,
    database: false,
    stripe: false,
    storage: false
  };
  private metrics: Record<keyof SystemStatus, ServiceMetrics> = {
    auth: { responseTime: 0, errorRate: 0, uptime: 100 },
    database: { responseTime: 0, errorRate: 0, uptime: 100 },
    stripe: { responseTime: 0, errorRate: 0, uptime: 100 },
    storage: { responseTime: 0, errorRate: 0, uptime: 100 }
  };

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const start = performance.now();
      const { data } = await supabase.auth.getSession();
      const responseTime = performance.now() - start;
      
      this.updateMetrics('auth', responseTime, !data.session);
      return true;
    } catch (error) {
      this.updateMetrics('auth', 0, true);
      return false;
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const start = performance.now();
      const { data } = await supabase.from('health_check').select('*').limit(1);
      const responseTime = performance.now() - start;
      
      this.updateMetrics('database', responseTime, !data);
      return true;
    } catch (error) {
      this.updateMetrics('database', 0, true);
      return false;
    }
  }

  private async checkStripe(): Promise<boolean> {
    try {
      const start = performance.now();
      const response = await fetch('/api/stripe/health');
      const responseTime = performance.now() - start;
      
      this.updateMetrics('stripe', responseTime, !response.ok);
      return response.ok;
    } catch (error) {
      this.updateMetrics('stripe', 0, true);
      return false;
    }
  }

  private async checkStorage(): Promise<boolean> {
    try {
      const start = performance.now();
      const { data } = await supabase.storage.listBuckets();
      const responseTime = performance.now() - start;
      
      this.updateMetrics('storage', responseTime, !data);
      return true;
    } catch (error) {
      this.updateMetrics('storage', 0, true);
      return false;
    }
  }

  private updateMetrics(
    service: keyof SystemStatus,
    responseTime: number,
    hasError: boolean
  ) {
    const metrics = this.metrics[service];
    
    // Update response time (moving average)
    metrics.responseTime = responseTime > 0
      ? (metrics.responseTime * 0.7) + (responseTime * 0.3)
      : metrics.responseTime;

    // Update error rate (exponential moving average)
    metrics.errorRate = (metrics.errorRate * 0.9) + (hasError ? 0.1 : 0);

    // Update uptime
    if (hasError) {
      metrics.uptime = Math.max(0, metrics.uptime - 0.1);
    } else {
      metrics.uptime = Math.min(100, metrics.uptime + 0.01);
    }
  }

  private async checkAllServices() {
    this.status = {
      auth: await this.checkAuth(),
      database: await this.checkDatabase(),
      stripe: await this.checkStripe(),
      storage: await this.checkStorage()
    };
  }

  private startMonitoring() {
    // Initial check
    this.checkAllServices();

    // Regular monitoring
    setInterval(() => {
      this.checkAllServices();
    }, 30000); // Check every 30 seconds
  }

  public getStatus(): SystemStatus {
    return { ...this.status };
  }

  public getMetrics(): Record<keyof SystemStatus, ServiceMetrics> {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  public async getSystemReport(): Promise<{
    status: SystemStatus;
    metrics: Record<keyof SystemStatus, ServiceMetrics>;
    timestamp: string;
  }> {
    await this.checkAllServices();
    return {
      status: this.getStatus(),
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

export const systemMonitor = SystemMonitor.getInstance();
