import { createApiApp } from './app.js';

const app = createApiApp();
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`ERLCPANEL API listening on :${port}`);
});
