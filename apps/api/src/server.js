import { createApiApp } from './app.js';
import { ApiToken } from './models/apiToken.js';

function assertRequiredEnv(keys) {
  const missing = keys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

assertRequiredEnv(['API_JWT_SECRET', 'DATABASE_URL', 'REDIS_URL', 'ERLC_SERVER_KEY', 'ERLC_GLOBAL_KEY']);

if (process.env.SENTRY_DSN && process.env.SENTRY_ENABLED !== 'true') {
  console.warn('SENTRY_DSN is set but SENTRY_ENABLED is not true; error reporting is disabled.');
}

const app = createApiApp();
const host = process.env.API_HOST || '0.0.0.0';
const port = Number(process.env.API_PORT || 3001);

async function bootstrapAdminTokenIfRequested() {
  if (process.env.API_TOKEN_BOOTSTRAP_ON_STARTUP !== 'true') {
    return;
  }

  const result = await ApiToken.provisionBootstrapFromEnv();
  if (!result) {
    throw new Error(
      'API_TOKEN_BOOTSTRAP_ON_STARTUP is enabled but BOOTSTRAP_API_TOKEN is not set.',
    );
  }

  if (result.created) {
    console.log(
      `Provisioned bootstrap token ${result.record.id}. Store BOOTSTRAP_API_TOKEN securely; plaintext is not persisted.`,
    );
    return;
  }

  console.log(`Bootstrap token already provisioned (${result.record.id}).`);
}

async function startServer() {
  await bootstrapAdminTokenIfRequested();
  app.listen(port, host, () => {
    console.log(`ERLCPANEL API listening on ${host}:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
