import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import { sendError, sendSuccess, withTrace } from './utils/response.js';

export function createApiApp() {
  const app = express();

  app.use(express.json());
  app.use(withTrace);

  app.get('/health', rateLimitMiddleware, (_req, res) => sendSuccess(res, { status: 'ok' }));

  app.use('/v1', authMiddleware, rateLimitMiddleware, routes);

  app.use((req, res) => sendError(res, 'NOT_FOUND', `Route ${req.path} not found`, { status: 404 }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Unexpected server error', { status: 500 });
  });

  return app;
}
