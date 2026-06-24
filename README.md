# Namma Raitha

Namma Raitha is a full-stack local farmer marketplace built with Next.js, Supabase, and Vercel. It helps farmers list fresh produce directly, lets buyers discover nearby verified farmers, and gives admins the tools to manage users, KYC, orders, reports, and platform activity.

Live website: [https://nammaraitha.vercel.app/](https://nammaraitha.vercel.app/)

## Overview

Namma Raitha started as a Flask, HTML, CSS, and JavaScript project and has been rebuilt as a production-ready Next.js application. The platform focuses on direct farmer-to-customer selling with a green farmer-friendly UI, local product catalog, image uploads, cart, wishlist, checkout, delivery tracking, reviews, farmer profiles, and admin moderation.

The goal is simple: make local produce discovery more transparent, trustworthy, and accessible for farmers and buyers.

## Key Features

### Farmer Portal

- Farmer dashboard with listed products, active orders, revenue, and analytics.
- Product catalog covering vegetables, fruits, flowers, millets, spices, greens, and other major farm produce.
- Add products using default catalog images plus farmer-uploaded photos.
- Inline product card editing for price, stock, description, and additional images.
- Farmer profile with profile photo, farm details, GPS location, and gallery.
- KYC document upload and verification status.
- Order management with step-by-step tracking:
  - Ordered
  - Packed
  - Out for delivery
  - Delivered
- Farmer-side order cancellation with visible cancellation reason for buyer and admin.

### Buyer Portal

- Marketplace with attractive product cards and farmer details.
- Search and category browsing.
- Filters for price, distance, rating, and verified farmers.
- Cart and wishlist.
- Delivery slot selection during checkout.
- Payment simulation with loading state, success popup, and redirect to orders.
- Realtime-style order updates without manual refresh.
- Detailed order tracking card.
- One review per completed order, with the option to edit the review.
- Farmer profile preview from product cards, including farm details, rating, products, and gallery photos.
- GPS based distance support for nearby produce discovery.

### Admin Portal

- Admin dashboard with platform summary.
- User and role management view.
- Farmer KYC approval workflow.
- Farmer verification badge management.
- Product and order monitoring.
- Review moderation and report abuse workflow.
- Audit logs and activity history.
- Backup endpoint for platform data.

Admin login:

```text
Username: admin
Password: Admin@123
```

## Production-Oriented Features

- Next.js App Router with API routes replacing the old Flask backend.
- Supabase Postgres database.
- Supabase Storage for product, profile, gallery, and KYC uploads.
- HTTP-only cookie based authentication.
- Inventory reservation during checkout to reduce double-purchase risk.
- Order tracking events with timestamps.
- Structured i18n translation JSON files for English and Kannada.
- Responsive mobile-first UI.
- Glassmorphism styling, green farmer theme, and accessible icon controls.
- Loading states, skeleton-style marketplace feel, pagination, and optimized product browsing.
- Sentry-ready dependency setup.
- Admin moderation tools and audit trail support.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | CSS, responsive layout, glassmorphism UI |
| Backend | Next.js API routes |
| Database | Supabase Postgres |
| Storage | Supabase Storage |
| Auth | Custom username/password auth with signed HTTP-only cookies |
| Maps | Leaflet |
| Icons | Lucide React |
| Deployment | Vercel |

## Project Structure

```text
nammaraitha-nextjs/
  src/
    app/
      api/                  # Backend API routes
      globals.css           # Global styling and responsive UI
      page.tsx              # Main app entry
    components/
      MarketplaceApp.tsx    # Main full-stack marketplace UI
      FarmersMap.tsx        # Farmer map component
    i18n/
      en.json               # English translations
      kn.json               # Kannada translations
    lib/
      api.ts                # API helpers and normalization
      productCatalog.ts     # Product catalog and default images
      session.ts            # Cookie session handling
      supabase.ts           # Supabase server client
      types.ts              # Shared TypeScript types
      validation.ts         # Zod validation schemas
  supabase/
    schema.sql              # Fresh Supabase database setup
    upgrade_existing_database.sql
  .env.example              # Required environment variables
  next.config.ts
  package.json
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nammaraitha-nextjs.git
cd nammaraitha-nextjs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

Open Supabase, create a new project, then run the SQL file below in the Supabase SQL Editor:

```text
supabase/schema.sql
```

This creates the required tables, indexes, storage bucket, policies, and database functions.

If you already created an older database and see schema cache errors such as missing product columns, run:

```text
supabase/upgrade_existing_database.sql
```

### 4. Configure environment variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Fill the values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_long_random_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Important: keep `SUPABASE_SERVICE_ROLE_KEY` private. It must only be used on the server or in Vercel environment variables.

### 5. Run locally

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev
```

Runs the app in development mode.

```bash
npm run build
```

Builds the app for production.

```bash
npm run start
```

Runs the production build locally.

```bash
npm run typecheck
```

Runs TypeScript checks without emitting files.

## Vercel Deployment

The project is designed for direct GitHub to Vercel deployment.

1. Push the project to GitHub.
2. Open Vercel and import the GitHub repository.
3. Add the same environment variables from `.env.local` in Vercel.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL:

```env
NEXT_PUBLIC_SITE_URL=https://nammaraitha-app.vercel.app
```

5. Deploy.

Live deployment:

[https://nammaraitha-app.vercel.app/](https://nammaraitha-app.vercel.app/)

## Supabase Notes

This project uses Supabase for:

- User profiles
- Farmer products
- Orders
- Order tracking events
- Reviews
- Reports
- KYC verification
- Audit logs
- Image storage
- Inventory reservation

Run `supabase/schema.sql` for a fresh setup. Run `supabase/upgrade_existing_database.sql` only when upgrading an older database.

## GPS and Location

GPS location works only when the browser allows location access. On mobile and production, the site must be opened over HTTPS.

The deployed Vercel site uses HTTPS, so GPS can work after the user grants browser permission:

[https://nammaraitha-app.vercel.app/](https://nammaraitha-app.vercel.app/)

## Image Uploads

Farmers can upload:

- Product photos
- Profile photos
- Farm gallery photos
- KYC documents

Products always keep their default catalog image first. Farmer-uploaded images are added as extra gallery photos, similar to ecommerce product galleries.

## Internationalization

Translations are structured through JSON files:

```text
src/i18n/en.json
src/i18n/kn.json
```

This keeps the UI ready for Kannada and English language support.

## Future Improvements

- Real payment gateway integration.
- SMS and WhatsApp order notifications.
- Farmer subscription plans.
- Buyer address book.
- Delivery partner dashboard.
- Advanced admin analytics.
- Push notifications.
- Product demand forecasting.
- Multi-district and multi-state expansion.

## Authors

- Dilip Kumar A N - dilipgowda7259@gmail.com
- Arya B V - aryabvarya18@gmail.com

## License

This project is created for learning, portfolio, and demonstration purposes.
