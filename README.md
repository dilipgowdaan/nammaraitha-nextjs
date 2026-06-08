# Namma Raitha Next.js

A Vercel-ready Next.js rebuild of the original Flask marketplace. It keeps the original farmer and buyer flows, then adds a cleaner dashboard, Supabase persistence, stock-safe ordering, product editing, farmer discovery maps, profile/gallery updates, payment simulation, delivery tracking, reviews, and farmer analytics.

## Stack

- Next.js App Router
- TypeScript
- Supabase Postgres
- Custom username/password auth with signed HTTP-only cookies
- Leaflet maps
- Lucide icons

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run `supabase/schema.sql` in the Supabase SQL editor.

If you already created the tables before and see an error like `Could not find the 'category' column of 'products' in the schema cache`, run `supabase/upgrade_existing_database.sql` once in the Supabase SQL editor, then redeploy.

3. Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start development:

```bash
npm run dev
```

## Deploy on Vercel

Push this folder to GitHub, import the repo in Vercel, add the same environment variables, and deploy. The server API routes use the Supabase service role key, so keep it only in Vercel/server env vars and never expose it in browser code.

## Important files

- `src/components/MarketplaceApp.tsx`: full frontend app
- `src/app/api/*`: backend API routes replacing Flask endpoints
- `src/lib/session.ts`: signed cookie session handling
- `src/lib/supabase.ts`: Supabase server client
- `supabase/schema.sql`: tables, indexes, RLS, and atomic order RPC
