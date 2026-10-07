import Link from 'next/link';
export const metadata = { title: 'Page not found', robots: { index: false } };
export default function NotFound() {
  return <div className="wrap" style={{ padding: '90px 0', textAlign: 'center' }}><h1>Page not found</h1><p className="note" style={{ margin: '10px 0 22px' }}>That page does not exist or the product was removed.</p><Link className="btn red" href="/">Back to the shop</Link></div>;
}
