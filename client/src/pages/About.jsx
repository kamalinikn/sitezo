import PageHero from '../components/PageHero.jsx';
import { VALUES } from '../data/site.js';
export default function About() {
  return (<>
    <PageHero title="We believe every business deserves a digital identity.">SITEZO is a young, technology-driven business focused on helping businesses build a stronger digital presence.</PageHero>
    <section className="sec wrap"><div className="grid g2">
      <div className="card big"><span className="badge">Our mission</span><h2>To make professional digital experiences more accessible to businesses.</h2></div>
      <div className="card big"><span className="badge">Our vision</span><h2>A world where every ambitious business can be discovered, understood and remembered online.</h2></div></div>
      <div className="grid g4">{VALUES.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div></section>
    <section className="sec soft"><div className="wrap">
      <div><span className="badge">Meet the founder</span><h2>Kamalini Khanna R</h2><p className="role">Founder — SITEZO</p>
        <p className="lead">Kamalini started SITEZO to bring together entrepreneurship, technology and design — building digital solutions that help businesses present themselves clearly, earn trust and move forward.</p></div></div></section>
  </>);
}
