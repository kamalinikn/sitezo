import { useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { SITE } from '../data/site.js';

const empty = { name: '', business: '', email: '', phone: '', service: 'Custom website', budget: 'Not decided', message: '' };
export default function Contact() {
  const [f, setF] = useState(empty);
  const [st, setSt] = useState({ s: 'idle', m: '' });
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (st.s === 'busy') return;
    setSt({ s: 'busy', m: '' });
    try {
      const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      // Read as text first: an empty or non-JSON reply must never crash the form.
      const raw = await r.text();
      let d = null;
      try { d = raw ? JSON.parse(raw) : null; } catch { d = null; }
      if (!d) throw new Error(`The server sent an unexpected response (status ${r.status}). Please make sure the backend is running, then try again.`);
      if (!r.ok || !d.success) throw new Error(d.message || 'Something went wrong. Please try again.');
      setF(empty);
      setSt({ s: 'ok', m: "Thank you! Your enquiry has been received. We'll get back to you shortly." });
    } catch (err) {
      setSt({ s: 'err', m: err instanceof TypeError ? 'Could not reach the server. Please check your connection and try again.' : err.message });
    }
  };
  return (<>
    <PageHero title="Let's build something meaningful.">Have an idea, a business that needs a digital presence, or an existing website that needs a refresh? Tell us what you're building.</PageHero>
    <section className="sec wrap ct">
      <form onSubmit={submit} noValidate>
        <label>Full name<input required value={f.name} onChange={on('name')} autoComplete="name" /></label>
        <label>Business name<input value={f.business} onChange={on('business')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={on('email')} autoComplete="email" /></label>
        <label>Phone number<input type="tel" value={f.phone} onChange={on('phone')} autoComplete="tel" /></label>
        <label>Service required<select value={f.service} onChange={on('service')}><option>Custom website</option><option>UI/UX &amp; web design</option><option>Website maintenance</option><option>Not sure yet</option></select></label>
        <label>Project budget<select value={f.budget} onChange={on('budget')}><option>Not decided</option><option>Small project</option><option>Medium project</option><option>Large project</option></select></label>
        <label className="full">Message<textarea required value={f.message} onChange={on('message')} /></label>
        <div className="full"><button className="btn pri" disabled={st.s === 'busy'}>{st.s === 'busy' ? 'Sending...' : 'Send Project Enquiry'}</button></div>
        {st.m && <p className={`note ${st.s}`} role="status">{st.m}</p>}
      </form>
      <aside className="info">
        <div className="card"><h3>Email</h3><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div>
        <div className="card"><h3>Phone</h3><a href={`tel:+91${SITE.phone}`}>{SITE.phone}</a></div>
        <div className="card"><h3>Locations</h3>{SITE.locations.map((l) => <p key={l}>{l}</p>)}</div>
        <div className="card"><h3>Response</h3><p>We'll get back to you regarding your enquiry.</p></div>
      </aside>
    </section>
  </>);
}
