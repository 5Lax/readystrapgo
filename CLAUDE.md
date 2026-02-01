# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16.1.6 with App Router
- **Language:** TypeScript 5.9.3
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI:** Shadcn/ui components built on Radix UI
- **Styling:** Tailwind CSS v4 with OKLCH color system, dark theme default

## Architecture Overview

### Server vs Client Components

- Pages in `src/app/` use `"use client"` for interactive features
- Server actions in `src/lib/actions/` handle data fetching and calculations
- Supabase clients: `client.ts` for browser, `server.ts` for server-side

### Key Directories

- `src/app/` - Next.js App Router pages
- `src/components/ui/` - Shadcn/ui component library
- `src/lib/actions/catalog.ts` - Server actions for catalog data and quote calculations
- `src/lib/supabase/` - Supabase client configuration and middleware
- `src/lib/types.ts` - Core TypeScript interfaces

### Quote Calculation System

The builder page (`src/app/builder/page.tsx`) uses a multi-region pricing engine:
- 6 manufacturing regions: USA, Mexico, Taiwan, Vietnam, Cambodia, China
- `calculateQuote()` server action computes costs including: webbing, hardware, labor, tooling, volume discounts, and shipping
- Hardware and webbing catalogs stored in Supabase with region-specific pricing tiers

### Authentication Flow

- Supabase Auth with OAuth support
- Middleware (`src/middleware.ts`) refreshes sessions on each request
- Header component tracks auth state client-side with real-time subscription
- Callback handler at `src/app/auth/callback/route.ts`

### Database Schema

Key tables: `user_profiles`, `quotes`, `hardware_catalog`, `webbing_catalog`, `pricing_rules`, `projects`, `project_files`

Row-Level Security (RLS) enabled. Schema defined in `src/lib/supabase/schema.sql`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

The Supabase client handles missing/invalid env vars gracefully for local development.
