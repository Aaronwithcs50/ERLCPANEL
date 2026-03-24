import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import { sendError, sendSuccess, withTrace } from './utils/response.js';

function parseCorsOrigins(rawValue) {
  if (!rawValue || !rawValue.trim()) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsMiddleware(req, res, next) {
  const allowedOrigins = parseCorsOrigins(process.env.API_CORS_ORIGIN);
  const requestOrigin = req.headers.origin;

  if (allowedOrigins.includes('*')) {
    res.setHeader('access-control-allow-origin', '*');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('access-control-allow-origin', requestOrigin);
    res.setHeader('vary', 'Origin');
  }

  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'Content-Type,Authorization,x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return next();
}

export function createApiApp() {
  const app = express();

  app.use(corsMiddleware);
  app.use(express.json());
  app.use(withTrace);

  app.get('/health', rateLimitMiddleware, (_req, res) => sendSuccess(res, { status: 'ok' }));

  app.use('/v1', authMiddleware, rateLimitMiddleware, routes);

  app.use((req, res) =>
    sendError(res, 'NOT_FOUND', `Route ${req.path} not found`, { status: 404 }),
  );

  app.use((err, _req, res, _next) => {
    console.error(err);
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Unexpected server error', { status: 500 });
  });

  return app;
}
