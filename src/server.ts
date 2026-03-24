import { createApp } from './app.js';

type RequiredEnvKey =
  | 'BOT_TOKEN'
  | 'API_JWT_SECRET'
  | 'DATABASE_URL'
  | 'REDIS_URL'
  | 'ERLC_SERVER_KEY'
  | 'ERLC_GLOBAL_KEY';

function assertRequiredEnv(keys: RequiredEnvKey[]): void {
  const missing = keys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

assertRequiredEnv([
  'BOT_TOKEN',
  'API_JWT_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'ERLC_SERVER_KEY',
  'ERLC_GLOBAL_KEY',
]);

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`ERLCPANEL listening on ${port}`);
});
