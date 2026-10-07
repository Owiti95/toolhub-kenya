import Hero from '@/components/Hero';
import ProductBrowser from '@/components/ProductBrowser';
import { getBrands, getProducts, getSettings } from '@/lib/data';

export const revalidate = 60;

export default async function Home() {
  const [s, brands, products] = await Promise.all([getSettings(), getBrands(), getProducts()]);
  return (
    <>
      <Hero s={s} />
      <ProductBrowser products={products} brands={brands} active="all" />
      <div className="wrap">
        <div className="join">
          <div><h2>Get new stock and offers first</h2><p>Join the official {s.name} WhatsApp {s.ch ? 'channel' : 'group'} for price drops and arrivals.</p></div>
          {s.ch && <a className="btn wa" href={s.ch} target="_blank" rel="noopener noreferrer">Join on WhatsApp</a>}
        </div>
      </div>
    </>
  );
}
