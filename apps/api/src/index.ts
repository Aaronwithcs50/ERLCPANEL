import 'dotenv/config';
import express, { type Request, type Response } from 'express';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  console.log(`[api] listening on port ${port}`);
});
