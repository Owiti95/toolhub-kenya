import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import ProductBrowser from '@/components/ProductBrowser';
import { getBrands, getProducts } from '@/lib/data';
import { SITE, slugify } from '@/lib/util';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.id }));
}

export async function generateMetadata({ params }) {
  const brand = (await getBrands()).find((b) => b.id === params.slug);
  if (!brand) return { title: 'Brand not found', robots: { index: false } };
  const title = `${brand.name} tools in Nairobi, Kenya`;
  const description = `Shop ${brand.name} power tools and hand tools with delivery across Nairobi. Order on WhatsApp and pay on delivery.`;
  return { title, description, alternates: { canonical: `/brand/${brand.id}` }, openGraph: { title, description, url: `/brand/${brand.id}` } };
}

export default async function BrandPage({ params }) {
  const [brands, all] = await Promise.all([getBrands(), getProducts()]);
  const brand = brands.find((b) => b.id === params.slug);
  if (!brand) notFound();
  const products = all.filter((p) => slugify(p.brand) === brand.id);
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: brand.name, item: `${SITE}/brand/${brand.id}` },
    ],
  };
  return (
    <>
      <JsonLd data={ld} />
      <ProductBrowser products={products} brands={brands} active={brand.id}
        heading={<div className="page-head"><h1>{brand.name} tools in Nairobi</h1><p>{products.length} product{products.length === 1 ? '' : 's'} with delivery across Nairobi. Pay on delivery.</p></div>} />
    </>
  );
}
