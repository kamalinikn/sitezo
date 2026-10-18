// Backend validation for the contact form. Returns { value } or { error }.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{5,19}$/;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateEnquiry(body = {}) {
  const b = body && typeof body === 'object' ? body : {};
  const value = {
    name: str(b.name),
    email: str(b.email).toLowerCase(),
    phone: str(b.phone),
    message: str(b.message),
    // optional extras that the existing form also collects
    business: str(b.business).slice(0, 120),
    service: str(b.service).slice(0, 60),
    budget: str(b.budget).slice(0, 60),
  };
  if (!value.name || !value.email || !value.message)
    return { error: 'Please fill in all required fields.' };
  if (value.name.length < 2 || value.name.length > 100)
    return { error: 'Please enter your full name (2–100 characters).' };
  if (!EMAIL_RE.test(value.email) || value.email.length > 150)
    return { error: 'Please enter a valid email address.' };
  if (value.phone && !PHONE_RE.test(value.phone))
    return { error: 'Please enter a valid phone number, or leave it blank.' };
  if (value.message.length < 5)
    return { error: 'Please add a little more detail to your message.' };
  if (value.message.length > 2000)
    return { error: 'Your message is too long (maximum 2000 characters).' };
  return { value };
}
