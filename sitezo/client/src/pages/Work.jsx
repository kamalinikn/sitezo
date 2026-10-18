import PageHero from '../components/PageHero.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { Link } from 'react-router-dom';
import { WORK } from '../data/site.js';
export default function Work() {
  return (<>
    <PageHero title="Ideas we've brought to life.">Concept projects that show our approach. These are demonstrations, not real client engagements.</PageHero>
    <section className="sec wrap"><div className="grid g2">{WORK.map(([t, c, d], i) => (
      <article className="card pf" key={t}><div className={`th t${i}`}><span className="tag">Concept Project / Demo</span><div className="mk"><i/><i/><b/></div></div>
        <div className="pbd"><span className="cat">{c}</span><h3>{t}</h3><p>{d}</p><Link to="/contact" className="btn out sm">View Project</Link></div></article>))}</div></section>
    <CtaBand title="Have a project in mind? Let's build it." label="Start a Project" />
  </>);
}
