import React from 'react';
import { Router, Link } from 'wouter';
import { usePathname, useSearch } from 'wouter/use-location';
import './styles/styles.css';
import PageRouter from './components/router.jsx';

function MainNavigation() {
  const path = usePathname();
  const search = useSearch();
  const params = new URLSearchParams(path === '/' ? search : '');
  const linkedOnly = params.get('deepDives') === '1';
  params.delete('deepDive');
  params.delete('chapter');
  params.delete('deepDives');
  const browse = params.size ? '/?' + params : '/';
  params.set('deepDives', '1');
  return <nav aria-label="Main navigation">
    <Link href={browse} aria-current={path === '/' && !linkedOnly ? 'page' : undefined}>Browse</Link>
    <Link href={'/?' + params} aria-current={linkedOnly ? 'page' : undefined}>Deep dives</Link>
    <Link href="/about" aria-current={path === '/about' ? 'page' : undefined}>About</Link>
  </nav>;
}

export default function Home() {
  return (
    <Router>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">Skip to entry</a>
        <header className="site-header">
          <Link href="/" className="wordmark">The Antizionism Research Project</Link>
          <span className="site-description">Documenting the antizionist complex</span>
          <MainNavigation />
        </header>
        <main id="main-content"><PageRouter /></main>
      </div>
    </Router>
  );
}
