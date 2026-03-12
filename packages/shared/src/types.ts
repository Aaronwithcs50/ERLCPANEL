export type AppEnvironment = 'development' | 'staging' | 'production';

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  service: 'bot' | 'api' | 'web' | 'db';
  timestamp: string;
}
