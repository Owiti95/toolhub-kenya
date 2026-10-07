'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductBrowser({ products, brands, active = 'all', heading }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(s));
  }, [q, products]);
  return (
    <section id="shop" className="wrap shop" aria-label="Products">
      {heading}
      <div className="shop-head">
        <nav className="chips" aria-label="Brands">
          <Link className={`chip${active === 'all' ? ' on' : ''}`} href="/">All</Link>
          {brands.map((b) => <Link key={b.id} className={`chip${active === b.id ? ' on' : ''}`} href={`/brand/${b.id}`}>{b.name}</Link>)}
        </nav>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools, e.g. grinder, drill" aria-label="Search products" />
      </div>
      <div className="grid">{list.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}</div>
      {!list.length && <div className="empty">{products.length ? 'No products match. Clear the search or pick another brand.' : 'Products are coming soon. Message us on WhatsApp to ask what is in stock.'}</div>}
    </section>
  );
}
