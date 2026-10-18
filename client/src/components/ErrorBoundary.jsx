import { Component } from 'react';

// Shows a friendly message instead of a blank screen if a page throws.
// Remounted per route (see App.jsx), so navigating away always recovers.
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error('Page error:', err); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="sec wrap"><h2>Something went wrong.</h2><p className="lead">Please use the menu to open another page, or reload.</p></section>;
  }
}
