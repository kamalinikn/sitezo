import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import enquiry from './routes/enquiry.js';

// The Express app, shared by local development (server/index.js) and Vercel (api/index.js).
const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
app.set('trust proxy', 1); // behind Vercel's proxy: real client IP for rate limiting
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_, res) => res.json({ success: true, message: 'SITEZO API is running' }));
app.use('/api/enquiries', enquiry);
// Anything else under /api is a JSON 404 — never HTML or an empty body.
app.use('/api', (_, res) => res.status(404).json({ success: false, message: 'API route not found.' }));

// Only for `npm start` on your own machine/server. On Vercel the static site is served by Vercel itself.
if (!process.env.VERCEL) {
  const dist = path.join(dir, '../client/dist');
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(dist, 'index.html'), (e) => e && next());
  });
}

// Final error handler: always JSON (bad JSON bodies, oversized bodies, unexpected errors)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid request body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request is too large.' });
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
});

export default app;
