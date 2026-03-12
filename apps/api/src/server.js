import { createApiApp } from './app.js';
import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { ApiToken } from './models/apiToken.js';
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

const app = createApiApp();
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`ERLCPANEL API listening on :${port}`);
async function bootstrapAdminTokenIfRequested() {
  if (process.env.API_TOKEN_BOOTSTRAP_ON_STARTUP !== 'true') {
    return;
  }

  const result = await ApiToken.provisionBootstrapFromEnv();
  if (!result) {
    throw new Error('API_TOKEN_BOOTSTRAP_ON_STARTUP is enabled but BOOTSTRAP_API_TOKEN is not set.');
  }

  if (result.created) {
    console.log(`Provisioned bootstrap token ${result.record.id}. Store BOOTSTRAP_API_TOKEN securely; plaintext is not persisted.`);
    return;
  }

  console.log(`Bootstrap token already provisioned (${result.record.id}).`);
}

async function startServer() {
  await bootstrapAdminTokenIfRequested();
  app.listen(port, () => {
    console.log(`ERLCPANEL API listening on :${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
