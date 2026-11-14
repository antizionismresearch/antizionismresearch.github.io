import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import TweetCard from '../singleExample/TweetCard.jsx';
import { formatDate } from '../../lib/archive.mjs';
import './deepDive.css';

function asset(url) {
  return url?.startsWith('case-study-thumbs/') ? import.meta.env.BASE_URL + url : url;
}
function Evidence({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const caption = [...new Set([item.title, item.caption].filter(Boolean))].join('\n\n');
  return <article className="dive-evidence">
    {caption && <p className="dive-caption">{caption}</p>}
    {item.tweetId ? <TweetCard tweetId={item.tweetId} />
      : item.type === 'image' && item.imageUrl && !imageFailed
        ? <img className="dive-remote-image" src={item.imageUrl} alt={item.publication || 'Evidence screenshot'}
          onError={() => setImageFailed(true)} />
        : item.excerptText ? <blockquote>{item.excerptText}</blockquote>
        : <p className="muted">{imageFailed ? 'The image could not load. Open the original source below.' : 'This exhibit is available as a source link.'}</p>}
    <div className="dive-source">
      <span>{[item.publication, item.date && formatDate(item.date)].filter(Boolean).join(' · ')}</span>
      {!item.tweetId && item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">Open original source ↗</a>}
      {item.supportingSources?.filter(href => href !== item.url).map((href, i) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">Supporting source {i + 1} ↗</a>)}
    </div>
  </article>;
}

function Chapter({ page }) {
  const [index, setIndex] = useState(0);
  const touch = useRef(null);
  const length = page.evidence.length;
  const step = delta => setIndex(i => Math.max(0, Math.min(length - 1, i + delta)));
  return <section className="dive-chapter" aria-label={page.title}
    onKeyDown={event => {
      if (event.target.closest('video, iframe') || event.altKey || event.metaKey || event.ctrlKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }}>
    <div className="dive-chapter-head">
      {page.date && <span className="dive-kicker">{formatDate(page.date)}</span>}
      <h2>{page.title}</h2>
      {page.topline && <p className="dive-topline">{page.topline}</p>}
    </div>
    {length > 0 ? <>
      <div className="dive-item-nav" aria-label="Evidence navigation">
        <button className="button" disabled={index === 0} onClick={() => step(-1)}><ArrowLeft size={16} /> Previous item</button>
        <span aria-live="polite">Evidence {index + 1} of {length}</span>
        <button className="button" disabled={index === length - 1} onClick={() => step(1)}>Next item <ArrowRight size={16} /></button>
      </div>
      <div className="dive-swipe" onTouchStart={event => {
        touch.current = event.touches.length === 1 && !event.target.closest('video, iframe') ? [event.touches[0].clientX, event.touches[0].clientY] : null;
      }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
        if (!touch.current) return;
        const [x, y] = touch.current;
        touch.current = null;
        const dx = event.changedTouches[0].clientX - x;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.changedTouches[0].clientY - y) * 1.4) step(dx < 0 ? 1 : -1);
      }}>
        <Evidence key={index} item={page.evidence[index]} />
      </div>
    </> : <p className="muted">No evidence is available for this chapter.</p>}
  </section>;
}

export default function DeepDive({ study, pageId, onChapter, onClose }) {
  const dialog = useRef(null);
  const chapterRef = useRef(null);
  const tiles = useRef(new Map());
  const previousChapter = useRef(null);
  const currentIndex = study.pages.findIndex(page => page.id === pageId);
  const chapter = study.pages[currentIndex];
  const [columns, setColumns] = useState(() => window.matchMedia('(max-width: 760px)').matches ? 2 : 4);
  const rowEnd = Math.min(study.pages.length - 1, (Math.floor(currentIndex / columns) + 1) * columns - 1);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)');
    const update = () => setColumns(mobile.matches ? 2 : 4);
    update();
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const el = dialog.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      el.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (chapter) {
      previousChapter.current = chapter.id;
      chapterRef.current?.focus({ preventScroll: true });
      tiles.current.get(chapter.id)?.scrollIntoView({ block: 'nearest' });
    } else if (previousChapter.current) {
      const tile = tiles.current.get(previousChapter.current);
      tile?.focus({ preventScroll: true });
      tile?.scrollIntoView({ block: 'nearest' });
    }
  }, [chapter, columns]);
  return createPortal(<dialog ref={dialog} className="deep-dive" aria-labelledby="deep-dive-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="dive-header">
      <div><span className="dive-kicker">Deep dive · {study.pages.length} chapters</span><h1 id="deep-dive-title">{study.title.replace(/\s*·\s*deep dive$/i, '')}</h1></div>
      <button className="button dive-close" autoFocus onClick={onClose}><X size={17} /> <span>Return to timeline</span></button>
    </header>
    <div className="dive-body">
      <div className="dive-overview">
        {study.text && <p className="dive-summary">{study.text}</p>}
        <div className="dive-tiles" aria-label="Case study chapters">
          {study.pages.map((page, index) => {
            const image = asset(page.coverUrl);
            const overlay = (page.topline ?? '').trim();
            return <React.Fragment key={page.id}>
            <button ref={el => { if (el) tiles.current.set(page.id, el); else tiles.current.delete(page.id); }}
              className="dive-tile" aria-current={page.id === chapter?.id ? 'step' : undefined}
              aria-expanded={page.id === chapter?.id} aria-controls={page.id === chapter?.id ? 'dive-open-chapter' : undefined}
              onClick={() => onChapter(page.id === chapter?.id ? null : page.id)}>
              {image && <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
              <span className="dive-tile-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="dive-tile-label">
                <strong>{page.tileTitle?.trim() || page.title}</strong>
                {overlay && <span className="dive-tile-preview">{overlay}</span>}
              </span>
            </button>
            {chapter && index === rowEnd && <div id="dive-open-chapter" className="dive-expanded" ref={chapterRef} tabIndex={-1}>
        <div className="dive-chapter-nav">
          <button className="button" onClick={() => onChapter(null)}><ArrowLeft size={16} /> All chapters</button>
          <span>Chapter {currentIndex + 1} of {study.pages.length}</span>
        </div>
        <Chapter key={chapter.id} page={chapter} />
        <div className="dive-chapter-nav dive-chapter-footer">
          <button className="button" disabled={currentIndex === 0} onClick={() => onChapter(study.pages[currentIndex - 1].id)}><ArrowLeft size={16} /> Previous chapter</button>
          <button className="button" disabled={currentIndex === study.pages.length - 1} onClick={() => onChapter(study.pages[currentIndex + 1].id)}>Next chapter <ArrowRight size={16} /></button>
        </div>
      </div>}
            </React.Fragment>;
          })}
        </div>
      </div>
    </div>
  </dialog>, document.body);
}
