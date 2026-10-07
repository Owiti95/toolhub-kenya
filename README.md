# ToolHub Kenya (Next.js + Supabase)

Server-rendered tool catalogue with WhatsApp checkout, real admin login, Supabase Storage images and SEO built in.

## 1. Create the Supabase project
1. Create a project at supabase.com.
2. SQL Editor > New query > paste all of `supabase/schema.sql` > Run. This creates the tables, security rules (RLS) and the public `images` bucket.
3. Authentication > Users > **Add user** (email + password, tick "Auto confirm"). This is your admin login.
4. Open `supabase/make-admin.sql`, put your email in it, and run it in the SQL Editor. This makes you an admin.
5. Project settings > API: copy the **Project URL** and the **anon public** key.

## 2. Run
```
npm install
cp .env.example .env.local   # paste the URL and anon key
npm run dev
```
Open http://localhost:3000/admin, sign in, press "Load sample Deli products", then edit Settings and hero (set your WhatsApp number).

## 3. Deploy (Vercel)
Import the repo, add the same env vars (set `NEXT_PUBLIC_SITE_URL` to your real domain), deploy, then attach your domain.
Pages refresh from Supabase every 60 seconds (ISR).

## 4. SEO checklist
- Add `public/og.png` (1200x630): used for link previews of the home and brand pages.
- Verify the domain in Google Search Console and submit `https://your-domain/sitemap.xml`.
- Add a Google Business Profile for your Nairobi service area.
- Use clear product names (brand + model + key spec) and a one-sentence description: they become titles, meta descriptions and Product schema.

## Notes
- Only the anon key is used in the app. Never put the `service_role` key in `.env.local` or the code.
- Orders are saved to the `orders` table (view in Supabase > Table Editor), then WhatsApp opens. Totals come from the browser, so confirm prices in chat.
- Deleting a product leaves its image in the `images` bucket; remove it in Supabase > Storage if needed.
