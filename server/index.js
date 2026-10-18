// Local entry point (`npm run dev` / `npm start`). Vercel uses api/index.js instead.
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db.js';
import { emailStatus, verifyEmail, describeMailError, smsEnabled, smsConfigured } from './services/notifications.js';

connectDB()
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
    console.log(smsEnabled()
      ? `SMS notifications: enabled (${smsConfigured() ? 'Twilio configured' : 'but Twilio variables are missing, so SMS is skipped'})`
      : 'SMS notifications: disabled');
  }))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
