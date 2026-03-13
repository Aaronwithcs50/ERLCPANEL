import { createApiApp } from './app.js';
import { ApiToken } from './models/apiToken.js';

const app = createApiApp();
const port = Number(process.env.PORT || 3000);

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
  app.listen(port, () => {
    console.log(`ERLCPANEL API listening on :${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
