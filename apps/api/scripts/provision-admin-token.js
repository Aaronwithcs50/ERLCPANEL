import crypto from 'node:crypto';
import { ApiToken } from '../src/models/apiToken.js';

async function main() {
  const token = process.env.BOOTSTRAP_API_TOKEN || crypto.randomBytes(24).toString('hex');
  process.env.BOOTSTRAP_API_TOKEN = token;

  const result = await ApiToken.provisionBootstrapFromEnv();

  if (!result) {
    throw new Error('Unable to provision bootstrap token. Set BOOTSTRAP_API_TOKEN or allow auto-generation.');
  }

  if (!result.created) {
    console.log(JSON.stringify({
      created: false,
      message: 'Bootstrap token already exists; no plaintext token returned.',
      tokenId: result.record.id
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    created: true,
    token: result.rawToken,
    tokenInfo: result.record,
    warning: 'Save this plaintext token now. It is not stored and cannot be retrieved again.'
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
