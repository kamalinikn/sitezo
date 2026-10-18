import PageHero from '../components/PageHero.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { Link } from 'react-router-dom';
import { SERVICES } from '../data/site.js';
const WHY = ['Designed around your business', 'Mobile-first thinking', 'Modern visual identity', 'User-focused experience', 'Clear communication', 'Scalable solutions'];

export default function Services() {
  return (<>
    <PageHero title="Solutions built around your business.">We don't believe every business needs the same digital solution. We build experiences around your goals, customers and brand.</PageHero>
    <section className="sec wrap">{SERVICES.map((s, i) => (
      <div className="svc" key={s.t}><div><span className="num">{String(i + 1).padStart(2, '0')}</span><h2>{s.t}</h2><p>{s.d}</p>
        <Link to="/contact" className={i ? 'btn out' : 'btn pri'}>{s.cta}</Link></div>
        <ul>{s.pts.map((p) => <li key={p}>{p}</li>)}</ul></div>))}</section>
    <section className="sec soft"><div className="wrap"><h2>What makes a SITEZO experience different?</h2>
      <div className="grid g3">{WHY.map((w) => <div className="card why" key={w}>{w}</div>)}</div></div></section>
    <CtaBand title="Let's plan your website." label="Start a Project" />
  </>);
}
