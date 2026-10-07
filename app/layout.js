import { Archivo } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { CartButton, CartDrawer, CartProvider } from '@/components/Cart';
import JsonLd from '@/components/JsonLd';
import { getBrands, getSettings } from '@/lib/data';
import { SITE } from '@/lib/util';

const archivo = Archivo({ subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700', '800', '900'] });

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'ToolHub Kenya | Power tools and hand tools delivered in Nairobi', template: '%s | ToolHub Kenya' },
  description: 'Buy Deli, Stanley, Bosch, DeWalt, Black+Decker and Ryobi tools in Nairobi. Order on WhatsApp, delivery across Nairobi and pay on delivery.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'ToolHub Kenya', locale: 'en_KE', url: '/', images: ['/og.png'] },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#141414' };

export default async function RootLayout({ children }) {
  const [s, brands] = await Promise.all([getSettings(), getBrands()]);
  const parts = s.name.split(' ');
  const last = parts.length > 1 ? parts.pop() : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'Store', name: s.name, url: SITE,
    telephone: `+${String(s.wa).replace(/\D/g, '')}`, priceRange: 'KSh', paymentAccepted: 'Cash on delivery',
    areaServed: { '@type': 'City', name: 'Nairobi' }, address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
    sameAs: [s.ch].filter(Boolean),
  };
  return (
    <html lang="en-KE">
      <body className={archivo.className}>
        <JsonLd data={ld} />
        <CartProvider store={{ name: s.name, wa: s.wa }}>
          <header>
            <div className="wrap bar">
              <Link className="logo" href="/" aria-label={`${s.name} home`}>{parts.join(' ')} {last && <b>{last}</b>}</Link>
              <CartButton />
            </div>
          </header>
          <main>{children}</main>
          <footer>
            <div className="wrap foot">
              <p>{s.name} · Nairobi, Kenya</p>
              <nav aria-label="Brands">{brands.map((b) => <Link key={b.id} href={`/brand/${b.id}`}>{b.name} tools</Link>)}</nav>
            </div>
          </footer>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
