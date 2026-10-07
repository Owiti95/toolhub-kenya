export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const kes = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE');
export const waLink = (wa, text) =>
  `https://wa.me/${String(wa || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const DEFAULT_HERO = [
  { n: 'Deli', yr: 'Since 1981', wm: 'DELI', ac: '#ff5a5a', cat: 'Everyday power tools', t: 'Where the range starts.', d: 'Value-priced grinders, drills and saws for the workshop and the site. This is the range you can order right now.', i: '' },
  { n: 'Stanley', yr: 'Since 1843', wm: 'STANLEY', ac: '#e0a800', cat: 'Hand tools and storage', t: 'Made to be handed down.', d: 'Hammers, tape measures, spanners and toolboxes from one of the oldest names in hand tools.', i: '' },
  { n: 'Bosch', yr: 'Since 1886', wm: 'BOSCH', ac: '#ff4457', cat: 'Precision power tools', t: 'Engineered in Germany.', d: 'Drills, grinders and measuring tools known for accuracy and long service life.', i: '' },
  { n: 'DeWalt', yr: 'Since 1924', wm: 'DEWALT', ac: '#e0a800', cat: 'Heavy-duty site tools', t: 'Built for the job site.', d: 'Tough corded and cordless tools for people who use them all day, every day.', i: '' },
  { n: 'Black+Decker', yr: 'Since 1910', wm: 'BLACK\n+DECKER', ac: '#ff8a3d', cat: 'Home and garden tools', t: 'DIY, made easy.', d: 'Friendly, affordable tools for home repairs, weekend projects and the garden.', i: '' },
  { n: 'Ryobi', yr: 'Since 1943', wm: 'RYOBI', ac: '#8fa400', cat: 'Cordless tools', t: 'One battery, many tools.', d: 'The ONE+ system runs a wide range of tools on a single battery platform.', i: '' },
  { n: 'Delivery', yr: 'Nairobi and metro', wm: 'TO YOUR\nDOOR', ac: '#ff5a5a', cat: 'Pay on delivery', t: 'Then it comes to you.', d: 'We deliver across Nairobi and its metropolitan area, and you can pay on delivery. Tell us what you need on WhatsApp and we will confirm stock and delivery.', truck: true, i: '' },
];

export const DEFAULT_SETTINGS = {
  name: 'ToolHub Kenya',
  wa: process.env.NEXT_PUBLIC_DEFAULT_WA || '254795088806',
  ch: '',
  heroEyebrow: 'Professional tools · Nairobi',
  heroTitle: 'Six trusted tool brands, delivered to your door in',
  heroAccent: 'Nairobi',
  hero: DEFAULT_HERO,
};

export const SAMPLE_BRANDS = ['Deli'];
export const SAMPLE_PRODUCTS = [
  ['Angle Grinder 115mm 750W', 'Grinders', 2650, 'Side switch, auxiliary handle, protective cover.'],
  ['Impact Drill 13mm 650W (with bit set and case)', 'Drills', 3125, 'Hammer function, variable speed, forward/reverse.'],
  ['Jig Saw 600W', 'Saws', 3300, 'Cuts wood, metal and PVC. Blades included.'],
  ['Rotary Hammer SDS Plus 800W', 'Drills', 6500, '3J impact energy, 26mm concrete capacity, 3 drill bits and 2 chisels.'],
  ['Circular Saw 185mm 1300W', 'Saws', 5950, '0-45 degree bevel, 24T blade and guide ruler.'],
  ['Heat Gun 2000W', 'Other', 1800, 'Two temperature settings: 400 and 650 degrees C.'],
].map(([name, category, price, description]) => ({ name, brand: 'Deli', category, price, description, image: '', video: '', inStock: true }));
