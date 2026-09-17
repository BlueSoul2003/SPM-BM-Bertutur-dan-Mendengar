import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApplication } from '../server/app.js';

export function createVercelHandler(loadApplication: () => ReturnType<typeof createApplication>) {
 let application: ReturnType<typeof createApplication> | undefined;
 return async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    application ??= loadApplication()
      .then(app => {
        // Vercel overwrites x-forwarded-for with the client address.
        app.set('trust proxy', 1);
        return app;
      })
      .catch(error => { application = undefined; throw error; });
    const app = await application;
    app(request, response);
  } catch {
    console.error('API initialization failed');
    response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ error: 'Pelayan sedang bersedia. Sila cuba lagi sebentar.' }));
  }
 };
}

export default createVercelHandler(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Missing database configuration');
  return createApplication({ serverless: true, databaseUrl: process.env.DATABASE_URL });
});
