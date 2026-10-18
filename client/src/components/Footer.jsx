import { Link } from 'react-router-dom';
import { SITE } from '../data/site.js';
export default function Footer() {
  return (
    <footer className="ftr"><div className="wrap">
      <div className="fgrid">
        <div><img src="/logo-light.png" alt="SITEZO" className="flogo" /><p>Building digital experiences that help businesses move forward.</p></div>
        <div className="flinks">{SITE.nav.map(([l, to]) => <Link key={to} to={to}>{l}</Link>)}</div>
        <div className="fcon"><a href={`mailto:${SITE.email}`}>{SITE.email}</a><a href={`tel:+91${SITE.phone}`}>{SITE.phone}</a>{SITE.locations.map((l) => <span key={l}>{l}</span>)}</div>
      </div>
      <div className="fbot">© 2026 SITEZO. All rights reserved.</div>
    </div></footer>
  );
}
