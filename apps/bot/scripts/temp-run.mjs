import { spawn } from 'node:child_process';
import process from 'node:process';

const args = process.argv
  .slice(2)
  .map((value) => value.trim())
  .filter(Boolean);
const tokenArg = args.find((value) => value !== '--');
const token = tokenArg || process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Usage: pnpm --filter @apps/bot run temp <discord-bot-token>');
  console.error('You can also set BOT_TOKEN in your environment instead of passing an argument.');
  process.exit(1);
}

const child = spawn(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'tsx', 'src/index.ts'],
  {
    stdio: 'inherit',
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      BOT_TOKEN: token,
      BOT_DEBUG_STARTUP: process.env.BOT_DEBUG_STARTUP ?? 'true',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
