import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import enquiry from './routes/enquiry.js';
import { emailStatus, verifyEmail, describeMailError, smsConfigured } from './services/notifications.js';

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_, res) => res.json({ success: true, message: 'SITEZO API is running' }));
app.use('/api/enquiries', enquiry);
// Anything else under /api is a JSON 404 — never HTML or an empty body.
app.use('/api', (_, res) => res.status(404).json({ success: false, message: 'API route not found.' }));

const dist = path.join(dir, '../client/dist');
app.use(express.static(dist));
// SPA fallback so deep links like /services work in production
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(dist, 'index.html'), (e) => e && next());
});

// Final error handler: always JSON (bad JSON bodies, oversized bodies, unexpected errors)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid request body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request is too large.' });
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
});

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => app.listen(process.env.PORT || 5000, () => {
    console.log(`SITEZO API running on port ${process.env.PORT || 5000}`);
    const mail = emailStatus();
    if (mail.configured) {
      console.log(`Email notifications: configured (from ${mail.user}, to ${mail.to}). Checking Gmail login...`);
      mail.warnings.forEach((w) => console.warn(`Email notifications warning: ${w}.`));
      // Login check only: sends nothing and does not prove delivery.
      verifyEmail()
        .then(() => console.log('Email notifications: Gmail login verified.'))
        .catch((e) => console.error(`Email notifications: Gmail login check FAILED - ${describeMailError(e)}`));
    } else {
      console.log(`Email notifications: NOT configured (${mail.problems.join('; ')}). Enquiries are still saved.`);
    }
    console.log(`SMS notifications: ${smsConfigured() ? 'configured' : 'not configured (optional)'}`);
  }))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
