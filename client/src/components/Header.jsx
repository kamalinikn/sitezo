import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SITE } from '../data/site.js';

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="hdr"><div className="wrap nav">
      <Link to="/" className="brand" onClick={() => setOpen(false)}><img src="/logo.png" alt="SITEZO — Design. Develop. Deliver." /></Link>
      <nav className={open ? 'open' : ''} aria-label="Main">
        {SITE.nav.map(([l, to]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{l}</NavLink>)}
      </nav>
      <Link to="/contact" className="btn pri sm cta-h">Start a Project</Link>
      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
    </div></header>
  );
}
