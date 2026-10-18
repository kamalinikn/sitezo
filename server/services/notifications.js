// Owner notifications (email + SMS). Both are best-effort: notifyOwner() never throws to its
// caller, and nothing here ever logs credentials.
const SMS_VARS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'OWNER_PHONE_NUMBER'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Read an env var, trimmed and without wrapping quotes (Windows .env files often have them).
const env = (k) => String(process.env[k] ?? '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
const isPlaceholder = (v) => /your[-_ ]|<.*>|changeme|xxxx/i.test(v);

// ---------- email configuration ----------
// Accurate status of the Gmail settings. Never returns the password itself.
export function emailStatus() {
  const user = env('MAIL_USER');
  const pass = env('MAIL_PASS').replace(/\s+/g, ''); // Google shows App Passwords in groups of 4
  const custom = env('NOTIFICATION_EMAIL');
  const to = custom || user;
  const problems = [];
  if (!user) problems.push('MAIL_USER is not set');
  else if (!EMAIL_RE.test(user) || isPlaceholder(user)) problems.push('MAIL_USER must be your full Gmail address');
  if (!pass) problems.push('MAIL_PASS is not set');
  else if (isPlaceholder(pass)) problems.push('MAIL_PASS still contains the placeholder value');
  if (custom && !EMAIL_RE.test(custom)) problems.push('NOTIFICATION_EMAIL is not a valid email address');
  const warnings = !problems.length && pass.length !== 16
    ? ['MAIL_PASS is not 16 characters long; Google App Passwords are 16 letters (spaces are ignored)'] : [];
  return { configured: problems.length === 0, user, to, problems, warnings };
}
export const emailConfigured = () => emailStatus().configured;
export const smsConfigured = () => SMS_VARS.every((k) => env(k));
// SMS is OFF unless SMS_NOTIFICATIONS_ENABLED=true, even if Twilio variables are filled in.
export const smsEnabled = () => env('SMS_NOTIFICATIONS_ENABLED').toLowerCase() === 'true';

async function makeTransport(createTransport) {
  const make = createTransport || (await import('nodemailer')).default.createTransport;
  return make({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: env('MAIL_USER'), pass: env('MAIL_PASS').replace(/\s+/g, '') },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

// Turns low-level mail errors into a safe, useful hint for the server log (no secrets).
export function describeMailError(e) {
  const code = e?.code || '';
  if (code === 'EAUTH' || e?.responseCode === 535)
    return 'Gmail rejected the login. Check MAIL_USER, and that MAIL_PASS is a Google App Password (2-Step Verification must be on), not your normal password.';
  if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ENOTFOUND', 'ECONNREFUSED'].includes(code))
    return 'Could not reach smtp.gmail.com on port 465 (internet, firewall or antivirus may be blocking it).';
  return e?.message || 'Unknown email error';
}

// Checks the Gmail login only. It does NOT send anything and does not prove delivery.
export async function verifyEmail({ createTransport } = {}) {
  if (!emailStatus().configured) return 'skipped';
  const t = await makeTransport(createTransport);
  await t.verify();
  return 'verified';
}

// ---------- message content ----------
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const received = (d) => new Date(d || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) + ' (IST)';
const or = (v) => v || 'Not provided';

export function buildEmail(e) {
  const when = received(e.createdAt);
  const text = `New project enquiry received through the SITEZO website.

Name: ${e.name}
Email: ${e.email}
Phone: ${or(e.phone)}
Business: ${or(e.business)}
Service: ${or(e.service)}
Budget: ${or(e.budget)}

Message:
${e.message}

Received:
${when}
`;
  const row = (k, v) => `<tr><td style="padding:6px 18px 6px 0;color:#5E4F7A;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#210A4A;font-weight:600">${v}</td></tr>`;
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #EADCF0;border-radius:16px;overflow:hidden">
<div style="background:#32106A;color:#fff;padding:20px 24px"><div style="font-size:20px;font-weight:700">SITEZO</div><div style="opacity:.85">New project enquiry</div></div>
<div style="padding:24px"><p style="margin:0 0 16px;color:#210A4A">New project enquiry received through the SITEZO website.</p>
<table style="border-collapse:collapse;font-size:15px">${row('Name', esc(e.name))}${row('Email', `<a href="mailto:${esc(e.email)}" style="color:#C8006E">${esc(e.email)}</a>`)}${row('Phone', esc(or(e.phone)))}${row('Business', esc(or(e.business)))}${row('Service', esc(or(e.service)))}${row('Budget', esc(or(e.budget)))}</table>
<p style="margin:20px 0 6px;color:#5E4F7A">Message</p>
<div style="background:#F6EEFA;border-radius:12px;padding:14px 16px;white-space:pre-wrap;color:#210A4A">${esc(e.message)}</div>
<p style="margin:20px 0 0;color:#5E4F7A;font-size:14px">Received: ${esc(when)}</p>
<p style="margin:6px 0 0;color:#8A7BA6;font-size:13px">Tip: press Reply to answer the customer directly.</p></div></div>`;
  return { subject: `New SITEZO Project Enquiry — ${e.name}`.replace(/[\r\n]+/g, ' '), text, html };
}

export function buildSms(e) {
  const msg = e.message.length > 400 ? `${e.message.slice(0, 400)}…` : e.message;
  return `SITEZO New Enquiry\n\nName: ${e.name}\nPhone: ${or(e.phone)}\nEmail: ${e.email}\n\nMessage:\n${msg}`;
}

// ---------- senders ----------
export async function sendEmail(enquiry, { createTransport } = {}) {
  const st = emailStatus();
  if (!st.configured) return 'skipped';
  const transporter = await makeTransport(createTransport);
  const { subject, text, html } = buildEmail(enquiry);
  await transporter.sendMail({
    from: `"SITEZO Website" <${st.user}>`,
    to: st.to, replyTo: enquiry.email, subject, text, html,
  });
  return 'sent';
}

export async function sendSms(enquiry, { fetchFn = fetch } = {}) {
  if (!smsEnabled()) return 'disabled';
  if (!smsConfigured()) return 'skipped';
  const [sid, token, from, to] = SMS_VARS.map(env);
  const res = await fetchFn(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: buildSms(enquiry) }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    let d = {}; try { d = await res.json(); } catch { /* non-JSON error body */ }
    throw new Error(`Twilio responded ${res.status}${d.code ? ` (code ${d.code})` : ''}${d.message ? `: ${d.message}` : ''}`);
  }
  return 'sent';
}

// Email and SMS are attempted independently; one failing never affects the other, and
// neither can affect the already-saved enquiry.
export async function notifyOwner(enquiry, deps = {}) {
  const id = String(enquiry._id ?? '');
  const [em, sms] = await Promise.allSettled([sendEmail(enquiry, deps), sendSms(enquiry, deps)]);
  const out = {};
  const quiet = {
    skipped: { email: 'Email not configured; skipping email notification.', sms: 'Twilio not configured; skipping SMS notification.' },
    disabled: { sms: 'SMS notifications are disabled; skipping SMS notification.' },
  };
  const report = (label, r, explain) => {
    if (r.status === 'fulfilled') {
      out[label] = r.value;
      console.log(quiet[r.value]?.[label] || `${label.toUpperCase()} notification sent for enquiry ${id}.`);
    } else {
      out[label] = 'failed';
      const code = r.reason?.code ? ` [${r.reason.code}]` : '';
      console.error(`${label.toUpperCase()} notification FAILED for enquiry ${id} (enquiry is saved)${code}: ${explain(r.reason)}`);
    }
  };
  report('email', em, describeMailError);
  report('sms', sms, (e) => e?.message || e);
  return out;
}
