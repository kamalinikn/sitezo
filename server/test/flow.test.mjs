import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCreateEnquiry } from '../controllers/createEnquiryHandler.js';
import { notifyOwner, emailStatus, verifyEmail, buildEmail } from '../services/notifications.js';

const res = () => { const r = { code: 0, body: null, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; } }; return r; };
const good = { name: 'Asha Rao', email: 'Asha@Example.com', phone: '+91 98765 43210', message: 'I need a website for my shop.' };
const ENV = ['SMS_NOTIFICATIONS_ENABLED', 'MAIL_USER', 'MAIL_PASS', 'NOTIFICATION_EMAIL', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'OWNER_PHONE_NUMBER'];
const clearEnv = () => ENV.forEach((k) => delete process.env[k]);
const setAll = () => Object.assign(process.env, { SMS_NOTIFICATIONS_ENABLED: 'true', MAIL_USER: 'a@gmail.com', MAIL_PASS: 'abcd efgh ijkl mnop', TWILIO_ACCOUNT_SID: 'ACxxx', TWILIO_AUTH_TOKEN: 'SECRET_TOKEN', TWILIO_PHONE_NUMBER: '+10000000000', OWNER_PHONE_NUMBER: '+918870870678' });
const fakeModel = () => { const saved = []; return { saved, create: async (v) => { const d = { _id: 'id1', createdAt: new Date(), ...v }; saved.push(d); return d; } }; };

test('invalid input -> JSON 400, nothing saved, no notifications', async () => {
  const M = fakeModel(); let notified = false;
  const h = makeCreateEnquiry({ Enquiry: M, notify: async () => { notified = true; } });
  for (const body of [undefined, {}, { name: 'A', email: 'x', message: 'hi' }, { ...good, email: 'bad' }, { ...good, phone: 'abc' }]) {
    const r = res(); await h({ body }, r);
    assert.equal(r.code, 400); assert.equal(r.body.success, false); assert.ok(r.body.message);
  }
  assert.equal(M.saved.length, 0); assert.equal(notified, false);
});

test('valid input -> saved first, then notified, JSON 201', async () => {
  const M = fakeModel(); const order = [];
  const h = makeCreateEnquiry({ Enquiry: { create: async (v) => { order.push('save'); return M.create(v); } }, notify: async () => { order.push('notify'); } });
  const r = res(); await h({ body: good }, r);
  assert.deepEqual(order, ['save', 'notify']);
  assert.equal(r.code, 201);
  assert.deepEqual(r.body, { success: true, message: 'Your enquiry has been submitted successfully.' });
  assert.equal(M.saved[0].email, 'asha@example.com');
});

test('DB failure -> JSON 500, notifications not sent', async () => {
  let notified = false;
  const h = makeCreateEnquiry({ Enquiry: { create: async () => { throw new Error('db down'); } }, notify: async () => { notified = true; } });
  const r = res(); await h({ body: good }, r);
  assert.equal(r.code, 500); assert.equal(r.body.success, false); assert.equal(notified, false);
});

test('notification crash cannot undo a saved enquiry', async () => {
  const M = fakeModel();
  const h = makeCreateEnquiry({ Enquiry: M, notify: async () => { throw new Error('boom'); } });
  const r = res(); await h({ body: good }, r);
  assert.equal(r.code, 201); assert.equal(M.saved.length, 1);
});

test('nothing configured -> both skipped, no errors', async () => {
  clearEnv();
  assert.deepEqual(await notifyOwner({ _id: 1, ...good }), { email: 'skipped', sms: 'disabled' });
});

test('email OK + SMS fails -> email sent, sms failed, no token in logs', async () => {
  setAll(); const logs = []; const orig = console.error; console.error = (...a) => logs.push(a.join(' '));
  let mail;
  const out = await notifyOwner({ _id: 1, ...good, message: 'hello there' }, {
    createTransport: (cfg) => { assert.equal(cfg.auth.pass, 'abcdefghijklmnop'); return { sendMail: async (m) => { mail = m; } }; },
    fetchFn: async () => ({ ok: false, status: 400, json: async () => ({ code: 21608, message: 'unverified number' }) }),
  });
  console.error = orig;
  assert.deepEqual(out, { email: 'sent', sms: 'failed' });
  assert.equal(mail.to, 'a@gmail.com'); /* defaults to MAIL_USER */ assert.equal(mail.subject, 'New SITEZO Project Enquiry — Asha Rao');
  assert.ok(mail.text.includes('Received:') && mail.text.includes('Phone: +91 98765 43210'));
  assert.ok(logs.join('\n').includes('SMS notification FAILED') && !logs.join('\n').includes('SECRET_TOKEN'));
  clearEnv();
});

test('email fails + SMS OK -> sms still sent; Twilio request is well formed', async () => {
  setAll(); const orig = console.error; console.error = () => {};
  let req;
  const out = await notifyOwner({ _id: 1, ...good }, {
    createTransport: () => ({ sendMail: async () => { throw new Error('auth failed'); } }),
    fetchFn: async (url, o) => { req = { url, o }; return { ok: true, status: 201 }; },
  });
  console.error = orig;
  assert.deepEqual(out, { email: 'failed', sms: 'sent' });
  assert.ok(req.url.endsWith('/Accounts/ACxxx/Messages.json'));
  assert.equal(req.o.body.get('To'), '+918870870678'); assert.equal(req.o.body.get('From'), '+10000000000');
  assert.ok(req.o.body.get('Body').startsWith('SITEZO New Enquiry\n\nName: Asha Rao'));
  clearEnv();
});

test('html email escapes visitor input', () => {
  const { html } = buildEmail({ name: '<b>x</b>', email: 'a@b.co', phone: '', message: '<script>alert(1)</script>', createdAt: new Date() });
  assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;'));
});

test('email status: accurate for missing, placeholder, quoted and valid settings', () => {
  clearEnv();
  let st = emailStatus(); assert.equal(st.configured, false); assert.equal(st.problems.length, 2);
  process.env.MAIL_USER = 'your-gmail-address@gmail.com'; process.env.MAIL_PASS = 'your-16-character-app-password';
  assert.equal(emailStatus().configured, false);
  process.env.MAIL_USER = '"owner@gmail.com"'; process.env.MAIL_PASS = ' "abcd efgh ijkl mnop" ';
  st = emailStatus(); assert.equal(st.configured, true); assert.equal(st.user, 'owner@gmail.com'); assert.equal(st.to, 'owner@gmail.com'); assert.deepEqual(st.warnings, []);
  assert.ok(!JSON.stringify(st).includes('abcd'));           // status never contains the password
  process.env.NOTIFICATION_EMAIL = 'kamalinikhanna@gmail.com'; assert.equal(emailStatus().to, 'kamalinikhanna@gmail.com');
  process.env.NOTIFICATION_EMAIL = 'not-an-email'; assert.equal(emailStatus().configured, false);
  clearEnv();
});

test('wrong App Password: friendly hint logged, no secret, enquiry flow unaffected', async () => {
  setAll(); process.env.MAIL_PASS = 'wrongpassword1234'; const logs = []; const orig = console.error; console.error = (...a) => logs.push(a.join(' '));
  const M = fakeModel();
  const h = makeCreateEnquiry({ Enquiry: M, notify: (d) => notifyOwner(d, {
    createTransport: () => ({ sendMail: async () => { const e = new Error('Invalid login: 535 5.7.8 Username and Password not accepted'); e.code = 'EAUTH'; throw e; } }),
    fetchFn: async () => ({ ok: true }) }) });
  const r = res(); await h({ body: { ...good, business: 'Asha Stores', service: 'Custom website', budget: 'Small project' } }, r);
  console.error = orig;
  assert.equal(r.code, 201); assert.equal(r.body.success, true); assert.equal(M.saved.length, 1);
  const log = logs.join('\n');
  assert.ok(log.includes('EMAIL notification FAILED') && log.includes('[EAUTH]') && log.includes('App Password'));
  assert.ok(!log.includes('wrongpassword1234') && !log.includes('SECRET_TOKEN'));
  assert.ok(!JSON.stringify(r.body).includes('Gmail'));       // visitors never see mail details
  clearEnv();
});

test('email contains every enquiry field; verifyEmail only checks login', async () => {
  const { text, html } = buildEmail({ name: 'Asha', email: 'a@b.co', phone: '', business: 'Asha Stores', service: 'Custom website', budget: 'Small project', message: 'Hello world', createdAt: new Date() });
  for (const t of ['Name: Asha', 'Business: Asha Stores', 'Service: Custom website', 'Budget: Small project', 'Phone: Not provided', 'Received:']) assert.ok(text.includes(t), t);
  assert.ok(html.includes('Asha Stores') && html.includes('Small project'));
  clearEnv(); assert.equal(await verifyEmail(), 'skipped');
  setAll(); let verified = false, sent = false;
  assert.equal(await verifyEmail({ createTransport: () => ({ verify: async () => { verified = true; }, sendMail: async () => { sent = true; } }) }), 'verified');
  assert.ok(verified && !sent); clearEnv();
});

test('SMS is OFF by default: Twilio fully configured but flag unset -> no request, email still sent', async () => {
  setAll(); delete process.env.SMS_NOTIFICATIONS_ENABLED;
  let called = false, mailed = false;
  const out = await notifyOwner({ _id: 1, ...good }, {
    createTransport: () => ({ sendMail: async () => { mailed = true; } }),
    fetchFn: async () => { called = true; return { ok: true }; },
  });
  assert.deepEqual(out, { email: 'sent', sms: 'disabled' });
  assert.equal(called, false); assert.equal(mailed, true); clearEnv();
});

test('phone number is validated, saved and included in the email', async () => {
  const M = fakeModel(); const h = makeCreateEnquiry({ Enquiry: M, notify: async () => {} });
  const r = res(); await h({ body: good }, r);
  assert.equal(M.saved[0].phone, '+91 98765 43210');
  assert.ok(buildEmail(M.saved[0]).text.includes('Phone: +91 98765 43210'));
  const bad = res(); await h({ body: { ...good, phone: 'abc' } }, bad); assert.equal(bad.code, 400);
});
