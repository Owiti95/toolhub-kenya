'use client';
import { useEffect, useRef, useState } from 'react';
import { waLink } from '@/lib/util';

const DUR = 3800;
const Truck = () => (
  <svg viewBox="0 0 60 34" aria-hidden="true"><rect x="1" y="4" width="34" height="22" rx="2" fill="currentColor" /><path d="M37 11h12l9 9v6H37z" fill="currentColor" /><circle cx="14" cy="28" r="5" fill="#fff" stroke="currentColor" strokeWidth="3" /><circle cx="47" cy="28" r="5" fill="#fff" stroke="currentColor" strokeWidth="3" /></svg>
);

export default function Hero({ s }) {
  const slides = s.hero || [];
  const N = Math.max(slides.length, 1);
  const [idx, setIdx] = useState(0);
  const reduce = useRef(false);
  const sx = useRef(null);
  const cur = ((idx % N) + N) % N;
  // Radius scales with slide count so plates never overlap or leave gaps (fixes the hardcoded 7-slide angle).
  const k = Math.max(1, 0.65 / Math.tan(Math.PI / Math.max(N, 3)));

  useEffect(() => { reduce.current = matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);
  useEffect(() => {
    if (N < 2) return;
    const t = setInterval(() => { if (!reduce.current && !document.hidden) setIdx((i) => i + 1); }, DUR);
    return () => clearInterval(t);
  }, [N, idx]);

  return (
    <section id="hero" aria-label="Brands we deal in">
      <div className="wrap">
        <div className="hx-in">
          <div className="hx-txt">
            <p className="eyebrow"><span />{s.heroEyebrow}</p>
            <h1 className="hx-h1">{s.heroTitle} <b>{s.heroAccent}</b></h1>
            <div className="hx-chaps" aria-live="polite">
              {slides.map((b, i) => (
                <div key={i} className={`hx-chap${i === cur ? ' on' : ''}`} style={{ '--ac': b.ac || '#e21d2d' }} aria-hidden={i !== cur}>
                  <h2>{b.n}</h2><p className="hx-t">{b.t}</p><p>{b.d}</p>
                </div>
              ))}
            </div>
            <div className="hx-prog" aria-hidden="true"><i key={idx} style={{ animationDuration: `${DUR}ms` }} /></div>
            <div className="hx-dots" role="group" aria-label="Choose brand">
              {slides.map((b, i) => <button key={i} className={i === cur ? 'on' : ''} aria-label={`Show ${b.n}`} aria-current={i === cur} onClick={() => setIdx(idx + (i - cur))} />)}
            </div>
            <div className="hx-cta">
              <a className="btn red" href="#shop">Shop the tools</a>
              <a className="btn wa" target="_blank" rel="noopener noreferrer" href={waLink(s.wa, `Hello ${s.name}, I am looking for a tool from a specific brand.`)}>Ask about a brand</a>
              {s.ch && <a className="btn ghost" target="_blank" rel="noopener noreferrer" href={s.ch}>Join our WhatsApp channel</a>}
            </div>
          </div>
          <div className="hx-scene"
            onPointerDown={(e) => { sx.current = e.clientX; }}
            onPointerUp={(e) => { if (sx.current == null) return; const dx = e.clientX - sx.current; sx.current = null; if (Math.abs(dx) > 40) setIdx(idx + (dx < 0 ? 1 : -1)); }}
            onPointerCancel={() => { sx.current = null; }}>
            <div className="hx-ring" style={{ '--a': `${-idx * (360 / N)}deg`, '--n': N, '--k': k }}>
              {slides.map((b, i) => (
                <div key={i} className={`hx-plate${i === cur ? ' on' : ''}`} style={{ '--i': i, '--ac': b.ac || '#e21d2d' }} aria-hidden="true">
                  <span className="hx-yr">{b.yr}</span>
                  <div>
                    {b.i ? <img className="hx-logo-img" src={b.i} alt="" /> : b.truck ? <Truck /> : null}
                    <div className="hx-wm">{b.wm || b.n}</div>
                  </div>
                  <span className="hx-cat">{b.cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hx-strip">
          <div>Delivery across Nairobi and its metropolitan area<small>Confirmed with you on WhatsApp</small></div>
          <div>Pay on delivery<small>Check your tool first, then pay</small></div>
          <div>Order in minutes<small>Add to cart and send on WhatsApp</small></div>
        </div>
      </div>
    </section>
  );
}
