import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Link as LinkIcon, Search, X, Info } from 'lucide-react';
import Calendar from '../calendar/Calendar.jsx';
import Claims from '../claims/Claims.jsx';
import TweetCarousel from './TweetCarousel.jsx';
import DeepDive from '../deepDive/DeepDive.jsx';
import { deepDives, deepDivesByEntry } from '../../data/deepDives.js';
import { readDeepDive, searchDeepDives } from '../../lib/deepDives.mjs';
import { allExamples, claims, claimMap } from '../../data/db.js';
import { closestEntry, filterEntries, formatDate, summarize } from '../../lib/archive.mjs';

const entries = [...allExamples].sort((a, b) => a.date.localeCompare(b.date) || a.exampleId.localeCompare(b.exampleId));
const countsByClaim = Object.fromEntries(claims.map(c => [c.claimId, entries.filter(e => (e.claimIds || []).includes(c.claimId)).length]));
const minMonth = entries[0]?.date.slice(0, 7) || '2023-10';
const maxMonth = entries.at(-1)?.date.slice(0, 7) || minMonth;
const linkedEntries = entries.filter(entry => deepDivesByEntry.has(entry.exampleId));
const timelineEntries = (categories, query, linkedOnly) =>
  filterEntries(linkedOnly ? linkedEntries : entries, categories, query, claimMap);

function readLocation() {
  const params = new URLSearchParams(window.location.search);
  const categories = (params.get('categories') || '').split(',').filter(id => claimMap[id]);
  const query = params.get('q') || '';
  const linkedOnly = params.get('deepDives') === '1';
  const matches = timelineEntries(categories, query, linkedOnly);
  const linked = matches.find(e => e.exampleId === params.get('entry'));
  const requestedDate = params.get('date');
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') && !Number.isNaN(Date.parse(requestedDate));
  const fallback = validDate ? requestedDate : '2023-10-07';
  const date = linked?.date || ((linkedOnly && !matches.some(entry => entry.date === requestedDate)) || !validDate
    ? closestEntry(matches, fallback)?.date || fallback : fallback);
  const entry = linked || matches.find(e => e.date === date);
  return { categories, query, linkedOnly, date, entryId: entry?.exampleId || null };
}

export default function MainPage() {
  const [view, setView] = useState(readLocation);
  const [deepDive, setDeepDive] = useState(() => readDeepDive(new URLSearchParams(window.location.search), deepDives));
  const [copyState, setCopyState] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [dateHelp, setDateHelp] = useState(false);
  const filtered = useMemo(() => timelineEntries(view.categories, view.query, view.linkedOnly), [view.categories, view.query, view.linkedOnly]);
  const diveMatches = useMemo(() => searchDeepDives(deepDives, view.query, view.categories), [view.query, view.categories]);
  const counts = useMemo(() => summarize(filtered), [filtered]);
  const dayEntries = filtered.filter(e => e.date === view.date);
  const current = dayEntries.find(e => e.exampleId === view.entryId) || dayEntries[0];
  const index = current ? filtered.indexOf(current) : -1;
  const previous = current ? filtered[index - 1] : [...filtered].reverse().find(e => e.date < view.date);
  const next = current ? filtered[index + 1] : filtered.find(e => e.date > view.date);
  const currentClaims = (current?.claimIds || []).map(id => claimMap[id]).filter(Boolean);
  const primaryClaim = currentClaims.find(c => view.categories.includes(c.claimId)) || currentClaims[0];
  const standalone = current?.standaloneTweets?.length > 0;
  const comparison = current?.thenVsNowFormat;
  useEffect(() => {
    const params = new URLSearchParams();
    if (current) params.set('entry', current.exampleId);
    params.set('date', view.date);
    if (view.categories.length) params.set('categories', view.categories.join(','));
    if (view.query) params.set('q', view.query);
    if (view.linkedOnly) params.set('deepDives', '1');
    if (deepDive) {
      params.set('deepDive', deepDive.study.exampleId);
      if (deepDive.pageId) params.set('chapter', deepDive.pageId);
    }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params}${window.location.hash}`);
  }, [current?.exampleId, view.date, view.categories, view.query, view.linkedOnly, deepDive]);
  useEffect(() => {
    const sync = () => {
      setView(readLocation());
      setDeepDive(readDeepDive(new URLSearchParams(window.location.search), deepDives));
    };
    window.addEventListener('popstate', sync);
    const syncBrowse = () => { if (window.location.pathname === '/') sync(); };
    window.addEventListener('pushState', syncBrowse);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('pushState', syncBrowse);
    };
  }, []);
  useEffect(() => { setCopyState(''); setManualLink(''); }, [view]);
  function selectDate(date) {
    setView(v => ({ ...v, date, entryId: filtered.find(e => e.date === date)?.exampleId || null }));
  }
  function changeFilters(categories, query, linkedOnly = view.linkedOnly) {
    const matches = timelineEntries(categories, query, linkedOnly);
    const retained = matches.find(e => e.exampleId === current?.exampleId);
    const target = retained || closestEntry(matches, view.date);
    setView(v => ({ ...v, categories, query, linkedOnly, date: target?.date || v.date, entryId: target?.exampleId || null }));
  }
  function go(entry) { if (entry) setView(v => ({ ...v, date: entry.date, entryId: entry.exampleId })); }
  async function copyLink() {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ entry: current.exampleId }).toString();
    try { await navigator.clipboard.writeText(url.href); setCopyState('Link copied'); }
    catch { setManualLink(url.href); setCopyState('Select and copy the link below'); }
  }
  return <div className="archive-page">
    <div className="browse-controls">
      <Calendar month={view.date.slice(0, 7)} selectedDate={view.date} counts={counts} minMonth={minMonth} maxMonth={maxMonth} onDateSelect={selectDate} onMonthChange={month => {
        const date = filtered.find(e => e.date.startsWith(month))?.date || `${month}-01`;
        selectDate(date);
      }} />
      <div className="filters-row">
        <label className="search-field"><Search size={18} /><span className="sr-only">{view.linkedOnly ? 'Search linked entries' : 'Search entries and deep dives'}</span><input type="search" placeholder={view.linkedOnly ? 'Search linked entries…' : 'Search entries and deep dives…'} value={view.query} onChange={e => changeFilters(view.categories, e.target.value)} /></label>
        <Claims selected={view.categories} counts={countsByClaim} onChange={ids => changeFilters(ids, view.query)} />
      </div>
      {(view.linkedOnly || view.categories.length > 0 || view.query) && <div className="active-filters">
        {view.linkedOnly && <button className="chip" onClick={() => changeFilters(view.categories, view.query, false)} aria-label="Remove Deep dives only filter">Deep dives only <X size={13} /></button>}
        {view.categories.map(id => <button className="chip" key={id} onClick={() => changeFilters(view.categories.filter(c => c !== id), view.query)} aria-label={`Remove ${claimMap[id].claimShortText} filter`}>{claimMap[id].claimShortText}<X size={13} /></button>)}
        <button className="text-button" onClick={() => changeFilters([], '', false)}>Clear filters</button>
        <span className="filter-summary" role="status">{filtered.length} matching {filtered.length === 1 ? 'entry' : 'entries'}{view.categories.length > 1 ? ' · any selected category' : ''}</span>
      </div>}
    </div>
    {!view.linkedOnly && view.query.trim() && deepDives.length > 0 && <section className="dive-search-results" aria-labelledby="dive-search-heading">
      <h2 id="dive-search-heading">Deep dives</h2>
      <p className="sr-only" role="status">{diveMatches.length} deep dive results</p>
      {diveMatches.length ? <ul>
        {diveMatches.map(result => {
          const { study, pageId } = result;
          const title = study.title.replace(/\s*·\s*deep dive$/i, '');
          const page = study.pages.find(p => p.id === pageId);
          return <li key={JSON.stringify([study.exampleId, pageId])}>
            <button className="dive-entry-link" onClick={() => setDeepDive(result)}>
              <span><strong>{page?.title || title}</strong><small>{page ? title : 'Open chapter overview'}</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </li>;
        })}
      </ul> : <p className="muted">No matching deep dives.</p>}
    </section>}
    <div className="entry-toolbar">
      <div className="event-date">Event date <span>·</span> {formatDate(view.date)}<button className="date-help icon-button" aria-label="How dates are assigned" aria-expanded={dateHelp} onClick={() => setDateHelp(!dateHelp)}><Info size={15} /></button></div>
      <div className="entry-navigation" aria-label="Entry navigation">
        <button className="button" disabled={!previous} onClick={() => go(previous)}><ArrowLeft size={16} />Previous</button>
        <span className="entry-count" aria-live="polite">Entry {current ? dayEntries.indexOf(current) + 1 : 0} of {dayEntries.length}</span>
        <button className="button" disabled={!next} onClick={() => go(next)}>Next<ArrowRight size={16} /></button>
      </div>
    </div>
    {dateHelp && <p className="date-explanation">Dates represent the event date or its best estimate. When the event date is unknown, the post’s publication date is used. Embedded posts may have a different date.</p>}
    {current ? <article className="entry" key={current.exampleId}>
      <div className="entry-tags">{[...new Set(currentClaims.map(c => c.parentName))].map(name => <span className="tag parent-tag" key={name}>{name}</span>)}{currentClaims.map(c => <button className="tag" key={c.claimId} onClick={() => changeFilters([c.claimId], view.query)} title={`Browse ${c.claimShortText}`}>{c.claimShortText}</button>)}{(current.claimIds || []).filter(id => !claimMap[id]).map(id => <span className="tag" key={id} title="This category has no label in the source data">Category {id}</span>)}</div>
      <h1>{primaryClaim?.claimShortText || 'Archive entry'}</h1>
      {primaryClaim?.claimText && <p className="claim-explanation">{primaryClaim.claimText}</p>}
      {current.text && <p className="entry-description">{current.text}</p>}
      {current.sourceLink && <p className="source-link"><a href={current.sourceLink} target="_blank" rel="noopener noreferrer">Supporting source ↗</a></p>}
      {deepDivesByEntry.has(current.exampleId) && <div className="dive-entry-links">
        {deepDivesByEntry.get(current.exampleId).map(link => <button className="dive-entry-link" key={link.study.exampleId} onClick={() => setDeepDive(link)}>
          <span><strong>Part of a deep dive</strong><small>{link.study.pages.find(page => page.id === link.pageId)?.title || 'Explore all chapters'} · {link.study.title.replace(/\s*·\s*deep dive$/i, '')}</small></span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>)}
      </div>}
      <div className={`evidence ${standalone ? 'standalone' : ''}`}>
        {standalone ? <TweetCarousel label="Posts" tweets={current.standaloneTweets} /> : <>
          <TweetCarousel label={comparison ? 'Then' : 'Them'} tweets={comparison ? current.thenTweets : current.themTweets} />
          <TweetCarousel label={comparison ? 'Now' : 'Us'} tweets={comparison ? current.nowTweets : current.usTweets} />
        </>}
      </div>
      <footer className="entry-footer"><button className="text-button copy-link" onClick={copyLink}><LinkIcon size={16} />Copy entry link</button><span role="status">{copyState}</span>
        {manualLink && <input className="manual-link" aria-label="Entry link" readOnly value={manualLink} onFocus={e => e.target.select()} />}
      </footer>
    </article> : <section className="empty-state" role="status">
      <h1>{filtered.length ? 'No entries on this date' : 'No matching timeline entries'}</h1>
      <p>{filtered.length ? 'Choose a day with a count, or use Previous and Next to reach the nearest entries.' : !view.linkedOnly && diveMatches.length ? 'You can open a matching deep dive above.' : 'Try clearing a filter or changing your search.'}</p>
      {(view.linkedOnly || view.query || view.categories.length > 0) && <button className="button" onClick={() => changeFilters([], '', false)}>Clear filters</button>}
    </section>}
    {deepDive && <DeepDive key={deepDive.study.exampleId} {...deepDive}
      onChapter={pageId => setDeepDive(d => ({ ...d, pageId }))}
      onClose={() => setDeepDive(null)} />}
  </div>;
}
