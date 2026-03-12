import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import { sendError, sendSuccess, withTrace } from './utils/response.js';

const app = express();
app.use(express.json());
app.use(withTrace);

app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok' }));

app.use('/v1', authMiddleware, rateLimitMiddleware, routes);

app.use((req, res) => sendError(res, 'NOT_FOUND', `Route ${req.path} not found`, { status: 404 }));

app.use((err, _req, res, _next) => {
  console.error(err);
  return sendError(res, 'INTERNAL_SERVER_ERROR', 'Unexpected server error', { status: 500 });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`ERLCPANEL API listening on :${port}`);
});
