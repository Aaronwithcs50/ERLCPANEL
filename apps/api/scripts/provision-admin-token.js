import crypto from 'node:crypto';
import { ApiToken } from '../src/models/apiToken.js';

async function main() {
  const token = process.env.BOOTSTRAP_API_TOKEN || crypto.randomBytes(24).toString('hex');
  process.env.BOOTSTRAP_API_TOKEN = token;

  const result = await ApiToken.provisionBootstrapFromEnv();

  if (!result) {
    throw new Error(
      'Unable to provision bootstrap token. Set BOOTSTRAP_API_TOKEN or allow auto-generation.',
    );
  }

  if (!result.created) {
    console.log(
      JSON.stringify(
        {
          created: false,
          message: 'Bootstrap token already exists; no plaintext token returned.',
          tokenId: result.record.id,
        },
        null,
        2,
      ),
    );
    return;
  }

  // The plaintext token is printed to stderr to discourage logging it; the structured JSON omits the secret.
  console.error('BOOTSTRAP_API_TOKEN (sensitive, do NOT store in logs):', result.rawToken);

  console.log(
    JSON.stringify(
      {
        created: true,
        tokenInfo: result.record,
        warning:
          'A new bootstrap token has been created. The plaintext token was printed separately and is not stored.',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
