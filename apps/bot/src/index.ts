import 'dotenv/config';

const environment = process.env.APP_ENV ?? 'development';

console.log(`[bot] starting Discord bot in ${environment} mode`);
