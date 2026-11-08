import React from 'react';
import { Router, Link } from 'wouter';
import './styles/styles.css';
import PageRouter from './components/router.jsx';

export default function Home() {
  return (
    <Router base="/">
      <div className="site-shell">
        <a className="skip-link" href="#main-content">Skip to entry</a>
        <header className="site-header">
          <Link href="/" className="wordmark">DOR HADASH</Link>
          <span className="site-description">Documenting the antizionist complex</span>
          <nav aria-label="Main navigation"><Link href="/">Browse</Link><Link href="/about">About</Link></nav>
        </header>
        <main id="main-content"><PageRouter /></main>
      </div>
    </Router>
  );
}
