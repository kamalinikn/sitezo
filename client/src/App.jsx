import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import About from './pages/About.jsx';
import Work from './pages/Work.jsx';
import Contact from './pages/Contact.jsx';
import Faq from './pages/Faq.jsx';

export default function App() {
  const location = useLocation();
  return (<>
    <ScrollToTop />
    <Header />
    <main>
      {/* key = pathname: each page mounts fresh on navigation and the error boundary resets */}
      <ErrorBoundary key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/work" element={<Work />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </ErrorBoundary>
    </main>
    <Footer />
  </>);
}
