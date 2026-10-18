import { Link } from 'react-router-dom';
export default function CtaBand({ title, label, to = '/contact' }) {
  return <section className="wrap"><div className="band"><h2>{title}</h2><Link to={to} className="btn light">{label}</Link></div></section>;
}
