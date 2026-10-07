import { SITE } from '@/lib/util';
export default function robots() {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin'] }], sitemap: `${SITE}/sitemap.xml` };
}
