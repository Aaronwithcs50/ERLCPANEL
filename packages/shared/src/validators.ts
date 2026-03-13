import { z } from 'zod';

export const environmentSchema = z.enum(['development', 'staging', 'production']);

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  service: z.enum(['bot', 'api', 'web', 'db']),
  timestamp: z.string().datetime(),
});
