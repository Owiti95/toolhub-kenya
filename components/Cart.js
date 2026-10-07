'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { kes, waLink } from '@/lib/util';

const Ctx = createContext(null);
const KEY = 'toolhub_cart_v2';
export const useCart = () => useContext(Ctx);

export function CartProvider({ store, children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY)) || []); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((p) => {
    setItems((cur) => {
      const found = cur.find((i) => i.slug === p.id);
      if (found) return cur.map((i) => (i.slug === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...cur, { slug: p.id, name: p.name, brand: p.brand, price: p.price, image: p.image || '', qty: 1 }];
    });
    setOpen(true);
  }, []);
  const setQty = useCallback((slug, d) =>
    setItems((cur) => cur.map((i) => (i.slug === slug ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);
  return <Ctx.Provider value={{ items, open, setOpen, add, setQty, clear, count, total, store }}>{children}</Ctx.Provider>;
}

export function CartButton() {
  const { count, setOpen } = useCart();
  return <button className="btn red" onClick={() => setOpen(true)} aria-haspopup="dialog">Cart ({count})</button>;
}

export function AddToCart({ product, className = '' }) {
  const { add } = useCart();
  return <button className={`btn ${className}`} onClick={() => add(product)}>Add to cart</button>;
}

export function CartDrawer() {
  const { items, open, setOpen, setQty, clear, total, store } = useCart();
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');
  const [err, setErr] = useState('');
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      lastFocus.current?.focus?.();
    }
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, setOpen]);

  const send = () => {
    const n = name.trim(), l = loc.trim();
    if (!n || !l) { setErr('Add your name and delivery location first.'); return; }
    setErr('');
    const lines = items.map((i) => `- ${i.qty} x ${i.name} (${i.brand}) @ ${kes(i.price)} = ${kes(i.price * i.qty)}`);
    const msg = `Hello ${store.name}, I would like to order:\n${lines.join('\n')}\nTotal: ${kes(total)}\nName: ${n}\nLocation: ${l}`;
    // Log the order without blocking: WhatsApp must open inside the click for mobile popup rules.
    supabase.from('orders').insert({
      name: n.slice(0, 100), location: l.slice(0, 200), total,
      items: items.map(({ slug, name, qty, price }) => ({ slug, name, qty, price })),
    }).then(() => {}, () => {});
    window.open(waLink(store.wa, msg), '_blank', 'noopener');
    clear(); setOpen(false);
  };

  return (
    <>
      <div className={`scrim${open ? ' on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Your cart" aria-hidden={!open} inert={!open ? '' : undefined}>
        <div className="ch"><h2>Your cart</h2><button ref={closeRef} className="btn ghost sm" onClick={() => setOpen(false)} aria-label="Close cart">✕</button></div>
        <div className="cl">
          {items.length === 0 && <p className="note empty-cart">Your cart is empty.<br />Add a tool to start an order.</p>}
          {items.map((i) => (
            <div className="row" key={i.slug}>
              <div className="thumb">{i.image ? <img src={i.image} alt="" /> : i.brand?.[0]}</div>
              <div className="info"><b>{i.name}</b><small>{kes(i.price)}</small></div>
              <div className="qty">
                <button onClick={() => setQty(i.slug, -1)} aria-label={`Remove one ${i.name}`}>−</button>
                <span>{i.qty}</span>
                <button onClick={() => setQty(i.slug, 1)} aria-label={`Add one ${i.name}`}>+</button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="cf">
            <div className="tot"><span>Total</span><span>{kes(total)}</span></div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" aria-label="Your name" />
            <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Delivery location (area / town)" autoComplete="street-address" aria-label="Delivery location" />
            {err && <small className="err" role="alert">{err}</small>}
            <button className="btn wa" onClick={send}>Send order on WhatsApp</button>
            <small className="note">Opens WhatsApp with your order filled in. Delivery is arranged in the chat and you can pay on delivery.</small>
          </div>
        )}
      </aside>
    </>
  );
}
