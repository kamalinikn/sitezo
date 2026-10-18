import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Jump to the top instantly (no smooth scroll) whenever the route changes.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
