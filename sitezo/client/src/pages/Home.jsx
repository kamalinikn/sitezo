import { Link } from 'react-router-dom';
import CtaBand from '../components/CtaBand.jsx';
import { SERVICES, STEPS } from '../data/site.js';

export default function Home() {
  return (<>
    <section className="hero"><div className="wrap hgrid">
      <div>
        <span className="badge">Modern websites for growing businesses</span>
        <h1 className="tagline"><span className="tg-a">Design.</span> <span className="tg-b">Develop.</span> <span className="tg-a">Deliver.</span></h1>
        <p className="lead">Digital experiences built to help businesses stand out, connect with customers, and grow.</p>
        <div className="row"><Link to="/contact" className="btn pri">Start Your Project</Link><Link to="/services" className="btn ghost">Explore Our Services</Link></div>
      </div>
      <div className="vis" aria-hidden="true">
        <div className="win a"><div className="bar"><s/><s/><s/></div><div className="ui"><i className="h"/><i className="b pk"/><i className="b"/><i className="l"/><i className="l s"/><i className="btnx"/></div></div>
        <div className="win b2"><div className="bar"><s/><s/><s/></div><pre>{`<section className="hero">\n  <h1>Your brand</h1>\n  <Button>Get started</Button>\n</section>`}</pre></div>
      </div>
    </div></section>

    <section className="sec wrap"><h2>Your business deserves more than just a signboard.</h2>
      <p className="lead">Customers increasingly discover and evaluate businesses online. A professional digital presence builds credibility, communicates your offerings and makes it easier for customers to connect.</p></section>

    <section className="sec soft"><div className="wrap"><h2>What we do</h2>
      <div className="grid g3">{SERVICES.map((s) => <article className="card" key={s.t}><div className="ic">{s.icon}</div><h3>{s.t}</h3><p>{s.d}</p></article>)}</div></div></section>

    <section className="sec wrap"><h2>Our process</h2>
      <ol className="steps">{STEPS.map(([t, d], i) => <li key={t}><b>{String(i + 1).padStart(2, '0')}</b><h3>{t}</h3><p>{d}</p></li>)}</ol></section>

    <CtaBand title="Ready to build your digital presence?" label="Let's Work Together" />
  </>);
}
