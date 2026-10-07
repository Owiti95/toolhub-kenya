import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCart } from '@/components/Cart';
import JsonLd from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';
import { getProduct, getProducts, getSettings } from '@/lib/data';
import { SITE, kes, slugify, waLink } from '@/lib/util';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }) {
  const p = await getProduct(params.slug);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  const title = `${p.name} (${p.brand}) price in Kenya`;
  const description = `${p.name} by ${p.brand} at ${kes(p.price)}. ${p.description} Delivery across Nairobi, pay on delivery.`.slice(0, 160);
  return {
    title, description, alternates: { canonical: `/p/${p.id}` },
    openGraph: { title, description, url: `/p/${p.id}`, images: p.image ? [p.image] : undefined },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProductPage({ params }) {
  const [p, s, all] = await Promise.all([getProduct(params.slug), getSettings(), getProducts()]);
  if (!p) notFound();
  const brandSlug = slugify(p.brand);
  const related = all.filter((x) => x.id !== p.id && slugify(x.brand) === brandSlug).slice(0, 4);
  const url = `${SITE}/p/${p.id}`;
  const product = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, sku: p.id,
    image: p.image ? [p.image] : undefined, brand: { '@type': 'Brand', name: p.brand }, category: p.category,
    offers: {
      '@type': 'Offer', url, priceCurrency: 'KES', price: p.price, itemCondition: 'https://schema.org/NewCondition',
      availability: p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: s.name },
    },
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: p.brand, item: `${SITE}/brand/${brandSlug}` },
      { '@type': 'ListItem', position: 3, name: p.name, item: url },
    ],
  };
  return (
    <div className="wrap pdp">
      <JsonLd data={product} /><JsonLd data={crumbs} />
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href={`/brand/${brandSlug}`}>{p.brand}</Link> / <span>{p.name}</span></nav>
      <div className="pdp-grid">
        <div className="pimg">
          {p.image ? <Image src={p.image} alt={`${p.name} by ${p.brand}`} fill priority sizes="(max-width:860px) 100vw, 560px" style={{ objectFit: 'contain', padding: 24 }} /> : <span>{p.brand?.[0]}</span>}
        </div>
        <div className="pinfo">
          <Link href={`/brand/${brandSlug}`} className="brand">{p.brand}</Link>
          <h1>{p.name}</h1>
          <div className="price big">{kes(p.price)}</div>
          <p className={p.inStock === false ? 'stock out' : 'stock'}>{p.inStock === false ? 'Out of stock. Ask us when it returns.' : 'In stock. Delivery across Nairobi, pay on delivery.'}</p>
          <p className="pdesc">{p.description}</p>
          <div className="pact">
            {p.inStock !== false && <AddToCart product={p} className="red" />}
            <a className="btn wa" target="_blank" rel="noopener noreferrer" href={waLink(s.wa, `Hello ${s.name}, is the ${p.name} available? ${url}`)}>Ask on WhatsApp</a>
          </div>
          {p.video && <video className="pvideo" src={p.video} controls muted playsInline preload="metadata" />}
        </div>
      </div>
      {related.length > 0 && (
        <section aria-labelledby="rel"><h2 id="rel" className="rel">More from {p.brand}</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>
      )}
    </div>
  );
}
