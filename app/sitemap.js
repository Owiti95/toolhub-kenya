import { getBrands, getProducts } from '@/lib/data';
import { SITE } from '@/lib/util';

export const revalidate = 3600;

export default async function sitemap() {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);
  return [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    ...brands.map((b) => ({ url: `${SITE}/brand/${b.id}`, changeFrequency: 'weekly', priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE}/p/${p.id}`, lastModified: p._t ? new Date(p._t) : undefined, changeFrequency: 'weekly', priority: 0.8 })),
  ];
}
