import Image from 'next/image';
import Link from 'next/link';
import { AddToCart } from './Cart';
import { kes, slugify } from '@/lib/util';

export default function ProductCard({ p, priority = false }) {
  return (
    <article className="card">
      <Link href={`/p/${p.id}`} className="ph" aria-label={p.name}>
        {p.image
          ? <Image src={p.image} alt={`${p.name} by ${p.brand}`} fill sizes="(max-width:560px) 50vw, 260px" style={{ objectFit: 'contain', padding: 16 }} priority={priority} />
          : <span>{p.brand?.[0]}</span>}
      </Link>
      <div className="cb">
        <Link href={`/brand/${slugify(p.brand)}`} className="brand">{p.brand}</Link>
        <small>{p.category}</small>
        <h3><Link href={`/p/${p.id}`}>{p.name}</Link></h3>
        <p className="desc">{p.description}</p>
        <div className="price">{kes(p.price)}</div>
        {p.inStock === false ? <button className="btn" disabled>Out of stock</button> : <AddToCart product={p} />}
      </div>
    </article>
  );
}
