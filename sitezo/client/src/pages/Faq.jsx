import PageHero from '../components/PageHero.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { FAQ } from '../data/site.js';
export default function Faq() {
  return (<>
    <PageHero title="Questions? We've got answers." />
    <section className="sec wrap faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <CtaBand title="Still have questions?" label="Talk to SITEZO" />
  </>);
}
