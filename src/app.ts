import express from 'express';

export function createApp() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'erlcpanel' });
  });

  app.get('/api/v1/ping', (_req, res) => {
    res.status(200).json({ message: 'pong' });
  });

  return app;
}
