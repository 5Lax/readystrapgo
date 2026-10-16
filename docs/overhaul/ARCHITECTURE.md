# ReadyStrapGo: rebuild proposal

Review date: October 16, 2026. Proposal only; no application or database changes.

## Recommendation

Build a product-led, B2B strap configuration and project workspace on Next.js and Supabase. Start with a small, verified catalog and a guided configurator. Make the configuration, bill of materials (BOM), estimate, submitted project, and sample revision refer to the same durable record. Add freeform assembly editing after that chain works end to end.

Keep ReadyStrapGo as the customer-facing brand, endorsed by A+ Products. Lead with finished straps, selectable webbing and hardware, and a clear path to a reviewed production quote. An estimate is useful; a success message without a saved record is not a completed workflow. Do not carry forward promises of automatic photo identification, guaranteed turnaround, or six immediately available manufacturing routes until operations can support them.

## Evidence and scope

Reviewed ReadyStrapGo at `ce6216d` and the read-only StrapBuilder clone at `55fcd04`. Review covered route entry points, authored components, configuration stores, pricing, connection geometry, catalog/template data, auth, server endpoints, migrations, assets, package/build setup, and repository notes. Generic UI primitives were inspected as supporting infrastructure. Repository notes describe intent; executable paths and checked-in migrations are the evidence for implementation.

ReadyStrapGo references below are relative to this document and open the current worktree. `SB:` references point to files in the [StrapBuilder snapshot](https://github.com/5Lax/StrapBuilder/tree/55fcd04); the local reference root is `/Users/chrislaurita/Desktop/CC Mac Mini/StrapBuilder`. That clone was not modified or started: its editor endpoints write into its own source catalog.

“Implemented” below means a real code path exists, not that a production database operation has been exercised. No production forms were submitted, accounts created, or database records changed. The deployed schema, storage policies, supplier costs, account roles, and notification integrations were not accessible evidence in this review.

### Live product and brand

- [ReadyStrapGo](https://readystrapgo.com/) redirects to `www.readystrapgo.com`. Chromium showed the dark, orange-accented homepage, buckle outline logo, upload-first hero, and links to templates, photos, builder, and samples. The page promises instant regional quotes and automatic BOM extraction. This matches the direction of the checked-in homepage, not proof those promises work.
- [A+ Products](https://www.aplusproducts.net/) uses black, white, and red, product photography, component families, and manufacturer-oriented sourcing language. Its storefront offers hardware and sample packs as well as finished goods. ReadyStrapGo should explain assembled custom work clearly alongside that component-shopping context.
- The [assembled webbing collection](https://www.aplusproducts.net/collections/assembled-webbing-straps) supplies concrete starting categories: sternum/backpack straps, luggage straps, loop straps, and pet collars. The [custom assembly page](https://www.aplusproducts.net/pages/custom-assembled-webbing-straps) is a useful source for the webbing + hardware + construction proposition.
- The [FIDLOCK V-BUCKLE 20 product page](https://www.aplusproducts.net/products/fidlock-v-buckle-20-black-flap-with-pull-tab) shows isolated hardware photography and a specific size/pack selection. A retail pack price is not an approved component cost for a custom assembly. Product identity, dimensions, pack units, and assembly costs need separate fields.

Use A+ product images with recorded source URLs and approved usage, not generic strap imagery. In a production rebuild, ingest approved assets into controlled storage; do not depend on hotlinked Shopify images or scrape storefront prices at quote time. The companion brand preview uses original schematic SVG illustrations, not product photographs or engineering drawings.

## Current state: ReadyStrapGo

### ReadyStrapGo stack and shape

[package.json](../../package.json) pins Next.js 16.1.6, React 19.2.3, and TypeScript 5.9.3; it uses Tailwind 4, Radix/shadcn-style primitives, Lucide, Sonner, `@supabase/ssr`, and Supabase JS. It is a single App Router application with a shared header/footer and hard-coded dark mode in [layout.tsx](../../src/app/layout.tsx). [globals.css](../../src/app/globals.css) has separate light/dark tokens. There is no separate API server, admin route tree, checkout, job worker, or checked-in test suite.

### What is implemented, and where it stops

| Area | Useful implementation | Broken, incomplete, or unverified boundary |
| --- | --- | --- |
| Marketing/navigation | [Homepage](../../src/app/page.tsx), [header](../../src/components/header.tsx), [footer](../../src/components/footer.tsx), materials, services, guidelines, and FAQ routes exist. The mobile navigation has real state. | Homepage file selection/drop only routes to `/upload`; the selected files are discarded. Footer links to `/blog`, `/about`, `/careers`, and `/privacy` have no corresponding routes. Marketing copy includes capabilities not implemented by the app. |
| Catalog | [catalog actions](../../src/lib/actions/catalog.ts) fetch active hardware/webbing, group categories/materials, and fetch individual records. [004](../../supabase/migrations/004_create_catalog_tables.sql) and [005](../../supabase/migrations/005_seed_catalog_data.sql) define and seed catalog/pricing tables. | Catalog browsing is embedded in the builder. `/materials` is a separate hard-coded guide, including price ranges; there are no canonical product detail routes. Region costs and specifications in seed data are unverified commercial inputs. |
| Guided configuration | [builder/page.tsx](../../src/app/builder/page.tsx) has five steps, length/width/plies/color selection, width-filtered hardware, quantities, and regional comparisons. | Nearly 1,000 lines mix domain logic and screen rendering. Type selection is not part of `QuoteConfig`. State is memory-only. Width changes clear webbing/color but do not reconcile already selected hardware. No assembly geometry, construction instructions, persistence, or resumable drafts. |
| Pricing | `calculateQuote` in [catalog.ts](../../src/lib/actions/catalog.ts) calculates material, hardware tiers, labor, tooling, volume discount, estimated freight, MOQ flags, and lead times for six seeded regions. | No runtime input schema or authoritative compatibility validation. Missing hardware IDs are skipped; missing prices become zero; every region is marked available; only the region rule MOQ is checked, not webbing regional MOQ. Freight weight excludes hardware. No duty calculation despite FAQ language. Values are estimates, not verified manufacturing offers. |
| Quote persistence | [quotes migration](../../supabase/migrations/002_create_quotes.sql) and an authenticated [dashboard](../../src/app/dashboard/page.tsx) exist. | Builder “Save Quote” only calls `toast.success` around line 940. It does not insert a quote. Dashboard expects the older `strap_specs`/boolean hardware shape from [types.ts](../../src/lib/types.ts), whereas the new builder uses catalog IDs. Its query error is not displayed, so a failed query can look like an empty account. |
| Duplicate pricing | [lib/pricing.ts](../../src/lib/pricing.ts) has a simpler material/hardware calculator and volume discounts. | It is not imported by the active builder. Its material list, pricing rules, and data shape differ from the server calculator. Retire it rather than keeping two price authorities. |
| Project submission | [upload/page.tsx](../../src/app/upload/page.tsx) has spec/sample paths, previews, contact details, a project insert, file uploads, and file metadata inserts. | Calls `generate_sample_number`, `projects`, `project_files`, and the `project-files` bucket, none of which are provisioned by the checked-in migrations. File metadata errors only log and still permit success. Earlier inserts/uploads survive later failures. Public file URLs are assumed. The label has an address placeholder and a decorative, non-encoding QR pattern. |
| Photo intake | [photos/page.tsx](../../src/app/photos/page.tsx) supports local image previews and editable-looking component results. | Detection uses a fixed mock component list, random dimensions/confidence, and a timer. “Continue” navigates without a durable analysis/project handoff. There is no image recognition service. Treat this as a prototype, not a measurement tool. |
| Templates | [templates/page.tsx](../../src/app/templates/page.tsx) renders three tech packs, previews, a download handler, and a real authenticated `template_requests` insert. | Only AI downloads are configured despite PDF/SVG badges. Two requested filenames use underscores in dates while [download assets](../../public/templates/downloads) use periods: SternLinkLite and FIDLOCKDogCollar links cannot resolve as written. Preview SVGs are not equivalent to complete downloadable tech packs. |
| Auth | [login](../../src/app/login/page.tsx), [signup](../../src/app/signup/page.tsx), [callback](../../src/app/auth/callback/route.ts), cookie SSR clients, session refresh, and header auth subscription are wired to Supabase. Dashboard checks `getUser()`. | No password reset or verified staff workflow. Notes mention OAuth but no provider sign-in UI is implemented. Browser client substitutes a dummy client without configuration; server client and middleware require real settings. Successful static compilation does not establish working auth. |
| Contact and samples | [Contact](../../src/app/contact/page.tsx) and [samples](../../src/app/samples/page.tsx) routes render. | Contact waits one second and reports success without sending/storing a message. Samples is a “Coming Soon” page. No sample-kit purchase or fulfillment flow. |
| Scanning | [scan API](../../src/app/api/scan/%5Bcode%5D/route.ts) looks up a code, records metadata, then redirects. [Landing page](../../src/app/scan/%5Bcode%5D/page.tsx) fetches sample/count; [client](../../src/app/scan/%5Bcode%5D/scan-landing-client.tsx) inserts feedback and looks up comparisons. | The “employee” switch only changes client state. Inventory save and history are demonstrations; feedback insert errors are ignored. Approval is an unauthenticated feedback type, not a verified decision. No sync worker exists. Geolocation is awaited over HTTP with a two-second timeout despite its “non-blocking” comment. Logging failures are ignored. |

### Database and access boundary

The migration set creates `user_profiles`, `quotes`, `template_requests`, `hardware_catalog`, `webbing_catalog`, `pricing_rules`, `scan_samples`, `scan_logs`, `scan_feedback`, and a `scan_stats` view. It does **not** create the project tables/RPC described in [CLAUDE.md](../../CLAUDE.md); its claimed `src/lib/supabase/schema.sql` is absent. The scanner migration references `public.is_admin()` without defining it anywhere in the checked-in SQL. A fresh database cannot reproduce all intended features from these files alone.

These are static design findings, not claims about the deployed database:

- [001](../../supabase/migrations/001_create_user_profiles.sql) allows users to update/insert their own profile. [004](../../supabase/migrations/004_create_catalog_tables.sql) later adds `role` to that same table and trusts it for admin decisions. No column-level restriction is recorded. Staff roles must move outside customer-editable profile data.
- Catalog policies named “active” actually use `USING (true)`. Action filters do not protect direct Data API reads. Pricing rules are publicly readable. Separate public product information from internal costing and unpublished inventory.
- [Scanner migration](../../supabase/migrations/20250101000009_create_sample_scanner.sql) makes entire sample rows publicly readable, including vendor contact/project fields. The landing page uses a privileged client and passes a `select('*')` record to a client component. A TypeScript interface does not remove extra fields from serialized data.
- `scan_stats` has no explicit invoker setting or recorded restricted grants. Review its access independently of base-table RLS. Public feedback/log insertion needs a deliberately limited server entry point and abuse controls.
- Quote ownership policies do not make client-supplied `estimated_price` or `status` trustworthy. A user-owned row still needs protected commercial fields and server-enforced transitions.

### Verification baseline

`npm run build` passed on Node 26.11.1 and npm 11.20.0. It compiled TypeScript and generated the public routes, with warnings about missing Supabase configuration and the deprecated middleware convention. No environment file was added. The current production runtime was not reproduced locally with a database.

`npm run lint` reports **29 problems: 16 errors and 13 warnings** in existing application files, including builder hook handling, unescaped JSX text, and scanner components declared during render. These predate this documentation. There is no `test` script. Application fixes belong to implementation work, outside this docs-only change.

## Current state: StrapBuilder

### StrapBuilder stack and shape

[SB: package.json](https://github.com/5Lax/StrapBuilder/blob/55fcd04/package.json) uses React 18, Vite 5, TypeScript 5.6, Tailwind 3, Wouter, Zustand 5, TanStack Query, Radix primitives, and an Express 4/tsx server. Drizzle/Neon, Passport/session packages, jsPDF, and html2canvas are installed, but installation is not evidence of a functioning database, login, or PDF export. The app has a single builder route in [SB: App.tsx](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/App.tsx).

### Useful behavior and unfinished boundaries

| Area | What exists | Implication for a rebuild |
| --- | --- | --- |
| Visual assembly | [SB: Canvas2D.tsx](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/components/Canvas2D.tsx) renders SVG assemblies, zoom/pan, placed components, artwork, alignment guides, dragging, and a tech-pack view toggle. | Valuable interaction research. Mouse/HTML-drag handlers and fixed sidebars are desktop-oriented; plan pointer, keyboard, and mobile alternatives. The live measurement overlay is explicitly disabled. |
| Connections | [SB: snapDetection.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/lib/snapDetection.ts) finds endpoint/slot proximity. [SB: connectionUtils.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/lib/connectionUtils.ts) calculates adaptive length, center, and rotation between hardware. | Keep the connection graph concept. Snap detection does not enforce the declared slot-width/orientation constraints. Canvas coordinates determine material length using repeated scale constants. Production dimensions must not change merely because an illustration is rearranged. |
| Catalog/templates | [SB: useCatalog.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/store/useCatalog.ts) imports 30 JSON components and four templates: collar, leash, camera strap, and handle. Includes width filtering, textures, artwork, costs, and connection points. | Useful taxonomy and fixtures, not an approved supplier catalog. The leash template’s snap-hook slot defaults to a side-release buckle. Validate semantic categories as well as width. Keep provenance and validate every asset/reference before import. |
| State | [SB: useConfig.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/store/useConfig.ts) maintains both legacy `BuildConfig` and modular instances. | No durable save/restore. `loadTemplateComponents` drops anchor transforms and does not set canvas placement flags, so the modular renderer filters those instances out until placement. Removing hardware does not clean up referenced connections. One canonical configuration must replace both stores' competing models. |
| BOM/pricing | [SB: builder.tsx](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/pages/builder.tsx) derives BOM and modular pricing; [SB: pricing.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/lib/pricing.ts) prices legacy selections. | Region switches at 1,000 units; two algorithms use different labor, freight, and markup assumptions. BOM rounds webbing to whole meters per batch. Unknown costs can fall back to zero/another region. No approved pricing authority or persistent quote. |
| Exports | Builder can download legacy config JSON; [SB: TechPackView.tsx](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/components/TechPackView.tsx) renders a dimensioned SVG using template/config. | PDF button only reports “coming soon.” JSON and tech-pack view do not consume current modular instances. The exported design can differ from the assembly being priced. |
| Text assistance | [SB: ai.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/lib/ai.ts) parses keywords and unit expressions. | It is regex parsing, not a model integration. The first `mm` expression can set both width and length; it can overwrite a parsed inch length. Keep plain input assistance only after disambiguation and user review. |
| Catalog editing | [SB: ComponentPalette.tsx](https://github.com/5Lax/StrapBuilder/blob/55fcd04/client/src/components/ComponentPalette.tsx) calls artwork/component update endpoints. [SB: routes.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/server/routes.ts) writes assets and source JSON. | Neither endpoint has an auth/role gate. JSON file writes are not transactional. They rely on a writable persistent filesystem and changes are not automatically reflected in an already bundled production catalog. Do not port this persistence approach. |
| Backend | [SB: storage.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/server/storage.ts) is an in-memory user map; [SB: schema.ts](https://github.com/5Lax/StrapBuilder/blob/55fcd04/shared/schema.ts) declares only users. | No project, quote, order, sample, or implemented customer/staff account system. The defined schema is not the active persistence layer. |
| Deployment | Build produces `dist/public` plus an Express bundle; [SB: vercel.json](https://github.com/5Lax/StrapBuilder/blob/55fcd04/vercel.json) publishes the static directory with an all-path index rewrite. | That configuration does not deploy the Express API. A static preview can look correct while artwork/catalog writes cannot work. Separate preview success from service availability. |
| Testing/docs | Component examples, `data-testid` hooks, [SB: design_guidelines.md](https://github.com/5Lax/StrapBuilder/blob/55fcd04/design_guidelines.md), and [SB: replit.md](https://github.com/5Lax/StrapBuilder/blob/55fcd04/replit.md) document intent. | No automated test suite/script. `npm run check` is TypeScript checking; reference build/check were not run in the read-only clone. Feature claims in notes exceed connected behavior. |

## Keep, rebuild, defer

| Keep as input | Rebuild as production behavior | Defer until evidence supports it |
| --- | --- | --- |
| ReadyStrapGo name and A+ endorsement; authentic product assets; spec/sample intake choices; width filtering; customer quote list; template education | Public catalog/product pages; one configuration model; validated estimate engine; durable project submission; private files; staff review and role model; functional contact form | Automatic photo-to-BOM, inference of measurements from photos, instant firm quotes across all six regions |
| StrapBuilder’s connection graph, SVG preview approach, component properties, BOM breakdown, unit conversion concepts | Accessible guided editor first; explicit construction allowances; revisioned BOM and exports; tested optional freeform editor | Full CAD, 3D, arbitrary imported SVG editing, real-time co-editing |
| Supabase Auth/Postgres/Storage and App Router conventions | Reproducible migrations, grants/RLS, server authorization, explicit unavailable/error states, real QR encoding and sample access | Checkout/payments, ERP/warehouse replacement, automatic supplier selection |

No wholesale copy of either application. Reuse narrowly reviewed UI primitives and domain fixtures; reimplement the service boundaries. Preserve existing customer/sample URLs through redirects or code aliases when migrating.

## Target stack and boundaries

Use a single Next.js App Router application with React, TypeScript strict mode, Tailwind, and a small shared Radix-based UI kit. Choose supported patched releases at implementation kickoff and pin them with npm's lockfile. Keeping the stack reduces migration work and supports public catalog rendering and authenticated workflows in one deployable unit. A Vite + Express split offers no clear benefit for this product's first release.

Use Server Components for public catalog/detail pages and account reads; client components for local form/editor interaction. The [Next.js server/client model](https://nextjs.org/docs/app/getting-started/server-and-client-components) supports this division. Keep domain calculations framework-independent. Use server actions for first-party mutations and route handlers for QR entry points, upload signing, and later external callbacks. Both call the same validated services. Next.js route handlers suit an application's own backend; a separate service is unnecessary at this stage. See [Vercel backend guidance](https://vercel.com/docs/frameworks/backend).

Use Supabase Auth, Postgres, and private Storage. SQL migrations are the schema authority; generate TypeScript database types from them. Use runtime schemas, such as Zod, at every mutation/import boundary. Use an isolated Zustand editor store only where undo/redo and interactive selection warrant it; keep derived prices outside that store. No extra ORM is needed for the first version. Use exact decimal arithmetic for calculations and explicit currency units for display.

Use a transactional outbox for notification/export/sync requests and a retrying worker. A database commit must not depend on successful email delivery. Keep external catalog and future operations-system adapters behind interfaces; begin with a reviewed import file and manual operations handoff. Public Shopify pages are reference material, not a runtime database. Select the worker hosting/provider during implementation based on actual job size and retry needs.

### Proposed folder layout

```text
src/
  app/
    (marketing)/page.tsx
    (marketing)/catalog/page.tsx
    (marketing)/catalog/[slug]/page.tsx
    (marketing)/templates/page.tsx
    (marketing)/materials/page.tsx
    (marketing)/contact/page.tsx
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (auth)/reset-password/page.tsx
    auth/callback/route.ts
    (workspace)/builder/page.tsx
    (workspace)/projects/page.tsx
    (workspace)/projects/[id]/page.tsx
    (workspace)/quotes/[id]/page.tsx
    (staff)/admin/layout.tsx
    (staff)/admin/projects/page.tsx
    (staff)/admin/catalog/page.tsx
    (staff)/admin/pricing/page.tsx
    (staff)/admin/samples/page.tsx
    scan/[code]/page.tsx
    api/scan/[code]/route.ts
    api/uploads/route.ts
    api/jobs/route.ts
  features/
    catalog/        # filters, cards, product imagery
    configurator/   # guided steps, optional editor, preview, editor store
    projects/       # intake, files, revision timeline
    quotes/         # estimate comparison, reviewed quote display
    samples/        # labels, customer feedback, staff scan views
    admin/          # review queue and publishing interfaces
  domain/
    catalog/        # units, variants, compatibility rules
    configurations/ # versioned schema, validation, BOM derivation
    pricing/        # pure calculation and rounding rules
    projects/       # allowed state transitions
  server/
    auth/           # authenticated user, staff and project access checks
    services/       # catalog, estimate, submission, approval, scan
    repositories/   # explicit database projections; no UI imports
    integrations/   # catalog import, notification, optional operations sync
    jobs/           # outbox processing, retries, exports
  lib/supabase/     # request client, browser client, isolated privileged client
  components/ui/
  content/          # reviewed marketing copy, source/proof notes
  generated/database.types.ts
supabase/
  migrations/
  seed.sql          # public synthetic fixtures only
  tests/            # grants, RLS, constraints, transitions
tests/             # domain and integration tests (root directory)
e2e/               # browser journeys (root directory)
docs/              # architecture, brand, operational instructions
```

Route groups do not change URLs or grant access. Every staff read/write requires a server check, and database policy enforces the same boundary. Use the supported session-refresh convention for the chosen Next.js version; refreshing a cookie is not authorization.

## Target data model

All tables below are **proposed**, not new migrations in this change. Default to UUID primary keys, `timestamptz`, explicit foreign keys, and bounded/check-constrained values. Catalog revision and cost provenance must be visible to staff. Store canonical dimensions in millimeters (`numeric`, retaining 25.4 mm for one inch); distinguish finished length from cut length and from display coordinates. Store quantity as a positive integer, currency as an explicit code, fractional component rates as exact decimals, and final quote totals as minor-unit integers with a documented rounding rule.

### Catalog and commercial inputs

| Table | Core fields and relationships | Authority / visibility |
| --- | --- | --- |
| `catalog_products` | `id`, unique `slug`, `kind` (webbing/hardware/assembly), category, title, description, supplier reference, source URL, publication state | Staff-published identity. Public reads limited to published records. |
| `catalog_variants` | `id`, `product_id` FK, unique supplier+SKU, width_mm, material, color code/name, finish, unit (`each`/`meter`), active state, spec revision | A specific selectable component, not a family of vaguely compatible widths. Preserve nominal sizes without silently equating 25 mm and 1 inch. |
| `catalog_assets` | `id`, `product_id` and optional `variant_id`, storage object path, alt text, purpose, source URL, usage approval, sort order | Approved photos/vectors/downloads. Public only when linked product and asset are published. |
| `compatibility_rules` | `id`, variant/variant pair or typed rule, slot width range, thickness bounds, connection type, construction constraints, reviewed_by | Versioned engineering rules; no assumed load rating from visual compatibility. |
| `assembly_templates` | `id` (revision UUID), stable `template_key`, `product_id`, version, typed configuration JSON, allowed options, preview asset, publication state | Validated starting assemblies; unique `(template_key, version)`. Referenced revision rows are immutable; configuration FKs point to their revision UUID. |
| `manufacturing_regions` | `id`, unique code, label, enabled, supported processes | Only reviewed routes appear to customers. |
| `cost_books` | `id`, region FK, currency, version, effective/expiry timestamps, approval state, approved_by | Private, immutable after publication. No credentials or real costs in public repo fixtures. |
| `component_costs` | `id`, cost_book FK, variant FK, min_qty, unit_rate, unit, MOQ, lead-time range | Private tier inputs; unique `(cost_book_id, variant_id, min_qty)`. Missing input means unavailable, never zero. |
| `process_rates` | cost_book FK, operation, basis, rate, setup amount, yield allowance | Cutting/sewing/printing/setup/packaging assumptions. Not a constant labor charge for every design. |

### Customer work and commercial output

| Table | Core fields and relationships | Authority / visibility |
| --- | --- | --- |
| `profiles` | `id` FK to `auth.users`, contact name, company, phone | Customer-editable contact information only. |
| `staff_memberships` | `user_id` FK, role (`reviewer`/`catalog_manager`/`admin`), active | Staff provisioning only; never customer-editable or inferred from email text. |
| `projects` | `id`, unique human reference, owner FK nullable during verified guest intake, title, workflow type, contact snapshot, quantity, target budget, timeline, status, source | Root workflow record. Customer sees own; staff according to role. Null owner does not imply public access. |
| `project_members` | project FK, user FK, permission | Explicit invited collaborators; unique `(project_id, user_id)`. Can launch with owner-only UI while preserving this boundary. |
| `configuration_revisions` | `id`, project FK, revision number, schema_version, template revision FK, normalized configuration JSON, content hash, created_by | Immutable committed revisions. JSON holds instances, connections, dimensions, options, and annotations, not trusted prices. Unique `(project_id, revision_no)`. |
| `bom_lines` | `id`, configuration_revision FK, variant FK, source instance ID, amount per assembly, unit, cut allowance, process references | Server-derived snapshot. Not independently editable beside configuration. |
| `project_files` | `id`, project FK, optional revision FK, unique object path, original filename, MIME, size, checksum, processing state | Private Storage metadata. Access follows project membership. No permanent public URLs. |
| `quote_requests` | `id`, project FK, configuration_revision FK optional for unstructured spec intake, requested quantity/destination, status, idempotency key | Request for commercial review; keeps file-only projects possible. |
| `quote_versions` | `id`, request FK, version, cost_book FK, calculation_version, currency, subtotal/setup/freight/tax/duty fields, total, validity, status, approved_by | Immutable estimate or issued offer tied to exact inputs. Unknown freight/tax/duty is explicitly pending, not silently zero. |
| `quote_lines` | quote_version FK, label, amount, unit, unit sell price, total, display order | Customer-facing sell-price breakdown. Private costing remains in private tables. |
| `project_events` | `id`, project FK, event type, actor, timestamp, customer-visible flag, payload | Append-only status/revision history. Staff-only notes are excluded from customer projections. |
| `contact_requests` | `id`, verified contact details, subject/message, status, optional project FK | Server-created intake, staff-readable, rate-limited; replaces simulated contact success. |

### Samples and operations

| Table | Core fields and relationships | Authority / visibility |
| --- | --- | --- |
| `samples` | `id`, project FK, configuration_revision FK optional, revision label, title, status, photo file FK, external reference | Private sample record associated with an exact revision. Supplier/contact details stay here, not in a public DTO. |
| `sample_links` | `id`, sample FK, unique hash of opaque token, permitted action/scope, expiry, revoked_at | Revocable QR access. Encode a random token URL, not a sequential project number. Store token hashes; generated labels may be retained in private storage. |
| `scan_events` | `id`, sample_link FK, timestamp, authenticated actor if any, coarse device category, deduplication key | Server writes only; staff analytics. Avoid precise location and raw IP retention by default. |
| `sample_feedback` | `id`, sample FK, revision, actor or verified guest, comment, optional rating, created_at | Feedback is separate from approval. Validate rating and lengths server-side. |
| `sample_approvals` | `id`, sample FK, revision, authorized approver FK, decision, comment, timestamp | Audited commercial action; QR possession and an entered email are not approval authority. |
| `sample_movements` | `id`, sample FK, quantity delta, location, actor, timestamp, idempotency key | Actual staff inventory history, only if this app owns sample inventory; otherwise display synchronized status from the operations system. |
| `outbox_jobs` | `id`, event type, aggregate ID, unique idempotency key, payload reference, attempts, next_attempt_at, completed_at | Private worker queue for confirmations, exports, imports, optional sync. Failed delivery never erases a submitted project. |
| `integration_mappings` | provider, external ID, local type/ID, last_sync_at, version, last_error | Optional operations/catalog adapter mapping. Define which system owns each field before enabling two-way writes. |

A separate order/payment subsystem is outside the first release. An accepted quote records intent and initiates staff follow-up; it does not silently charge a customer or imply production has started.

### Invariants and access rules

1. Enable RLS on every exposed table and set grants explicitly. Public catalog queries return only published products/variants/assets. Private costing and job tables live in an unexposed schema with restricted grants. Index referencing foreign keys and common policy predicates; start with `projects(owner_id, updated_at)`, `project_members(user_id, project_id)`, `configuration_revisions(project_id, revision_no)`, and `scan_events(sample_link_id, created_at)`. Inspect actual query plans before adding more indexes.
2. Customer writes cannot change staff roles, approved costs, issued quote amounts, ownership, or approval status. Profile editing uses a field allowlist. Owner/member predicates cover both existing rows and resulting rows on updates. Views must preserve intended access rather than accidentally bypass it. These boundaries follow the [Supabase RLS and grants model](https://supabase.com/docs/guides/database/postgres/row-level-security).
3. Prefer request-scoped user clients. Privileged clients stay in server-only modules and are used for narrowly scoped guest intake, QR resolution, and jobs after explicit authorization/validation. Never serialize raw database rows from privileged reads.
4. A configuration revision belongs to its project; a sample or quote cannot reference a different project's revision. Enforce this with composite keys/constraints or a transaction function, not just UI filtering. Costs, templates, and catalog variants referenced by history are archived rather than hard-deleted.
5. Submission commits project status, revision, request, and outbox event in one database transaction. Storage upload is a separate state machine: initialize → upload → verify metadata → finalize. Incomplete uploads remain recoverable drafts and are cleaned up by age, not shown as successful submissions.
6. Published revisions and quotes are immutable. Editing produces a new revision and invalidates an in-flight estimate for the previous content hash. Optimistic concurrency prevents silent overwrites. Notifications and imports deduplicate using stable event keys.
7. Treat untrusted uploads as private originals. Validate type/size and actual file contents, generate safe image previews, and serve active formats such as SVG as downloads or sanitized previews. Signed URLs expire. Bucket policies test the same project access rules as metadata.

## Key flows

### 1. Browse the catalog

Land on finished strap examples → filter by application, material, width, or hardware family → open an assembly or component detail → see real imagery, dimensions, compatible options, and a clear “Customize” action. Public pages render without requiring authentication. Filter state lives in the URL. Empty, unavailable, and discontinued states provide a next step instead of fabricated stock or pricing. Stock components can link explicitly to the A+ storefront; custom assemblies stay in the project workflow.

### 2. Customize a strap

Choose a validated assembly template or guided custom request → specify intended use → choose actual webbing variant and hardware → set finished/cut dimensions, color, construction, and quantity → review diagram and BOM. One versioned configuration schema serves wizard, preview, server validation, export, and later canvas editing.

Persist a local anonymous draft with a schema version; after sign-in or verified intake, save it to a project. Save status must distinguish local draft, saving, saved, and failed. Width changes revalidate all connected parts and show named incompatibilities. Editing length affects production dimensions; moving a diagram part affects layout only unless the user explicitly chooses a dimension edit. A numeric/form alternative supports every essential canvas action. Invalid or incomplete configurations can be saved as drafts but cannot receive a priced offer.

### 3. Estimate and quote

Submit a validated configuration hash, quantity, and destination → server reloads variants, checks compatibility/MOQs/availability, derives BOM and process quantities, then applies an approved cost book. Costs include cut/yield allowance, hardware quantities, sewing/printing, one-time setup, packaging, and defined freight assumptions. Display currency, quantity, per-unit price, batch total, setup, exclusions, validity, and whether the result is an estimate or staff-issued quote.

Do not silently substitute a missing regional price. Return “review needed” with the missing information. Do not label uncalculated duties as included. Reject nonfinite/negative values and unsupported units. Document decimal precision and when rounding occurs; never derive the invoice total by multiplying a rounded display-only unit estimate. Staff reviews exceptions and issues a quote version. Customer acceptance references that exact unexpired version and produces an auditable event.

### 4. Submit a project

Allow entry from a configuration, tech pack, photos, or physical sample. Create an intake draft with a server-issued reference and upload authorization → upload private files → verify completion → confirm contact ownership → finalize transaction → display receipt with project reference and next step. Guests get a short-lived claim/access link after email verification; anonymous users cannot list projects or files. Attach files selected on the homepage to the same intake session instead of losing them during navigation.

If an upload fails, show the specific failed file and retry it. If email delivery fails, keep the submitted receipt available and retry delivery through the outbox. Never display “submitted” based solely on a timer. Photo intake initially requests human review; AI suggestions can be added later with clear uncertainty and explicit customer confirmation.

### 5. Customer dashboard and staff workspace

Customers see projects, revisions, files, quote requests, issued offers, and sample decisions. Show actionable states: draft, submitted, needs information, in review, quoted, accepted, archived. Paginate lists and show query errors distinctly from empty states.

Staff signs in → server verifies role → opens review queue → checks specs/compatibility → requests missing information or issues a quote → records sample/production handoff. Catalog managers publish reviewed product revisions; pricing access is narrower than general customer-support access. Role changes and commercial edits create audit events. No customer-facing switch exposes the staff UI. Initial admin scope is catalog, costing, project review, and samples, not a full ERP.

### 6. Sample labels and scanning

Staff creates sample/revision → generate an actual standards-compliant QR encoding `https://readystrapgo.com/api/scan/<opaque-token>` → print a label with a human reference and revision → camera follows the URL → server validates active link/scope and records a minimal event → redirects to the permitted sample view. Use a maintained QR encoder and verify printed output by decoding it; an SVG that resembles a QR is insufficient.

Unknown, expired, revoked, and unavailable links get explicit screens. Avoid leaking existence/details for private samples. A public/sample-link view uses an allowlisted projection. Staff authentication unlocks authorized comparisons and inventory actions. An external customer verifies identity and authority before approving a specific sample revision. Changing the revision requires a new approval. Analytics should distinguish requests from verified human scans; browser previews/reloads can otherwise inflate counts. Do not delay the sample page for IP geolocation.

If an existing operations system remains authoritative, sync through idempotent mappings and show last-updated/error status. No browser writes directly to that system, and no “saved” message appears before a confirmed write.

## Ordered delivery plan

Each phase ends with a reviewable vertical slice and exit criteria. Timing should be estimated after catalog/pricing ownership and first-release scope are agreed.

| Phase | Deliverables | Exit criteria / dependencies |
| --- | --- | --- |
| 0 — Establish truth | Approved first catalog subset; product/asset provenance; real size/SKU mappings; cost/lead-time/MOQ owner; chosen brand direction; definition of estimate vs offer; inventory system ownership; route/data migration inventory | Operations validates at least three representative assemblies and worked BOM/price examples. Separate prototype seed data from approved facts. Decide whether initial prices require staff review. |
| 1 — Reproducible foundation | New app shell and tokens; migrations and synthetic seed; Auth/session flows; role model; private file bucket; domain schema; CI checks | Fresh local DB can reset from source. Anonymous/customer A/customer B/staff permission tests pass. Build, lint, type checks, and basic browser access pass without privileged client data leaking. Depends on phase 0 identity/access decisions. |
| 2 — Product-led catalog | Homepage in chosen direction; catalog/detail pages; reviewed photos; URL filters; templates/downloads; accurate materials content and working contact intake | Every published item has valid variants, assets, source, and compatibility data. Downloads resolve. Keyboard/mobile browse-to-template path works; no dead navigation or unsupported marketing claims. |
| 3 — Guided configuration | One config schema; template loading; dimensions/units; constrained component selection; SVG preview; BOM derivation; anonymous draft and account save/restore | Save/reload/export refer to the same revision. Tests cover width changes, duplicate parts, unit conversion, disconnected/invalid parts, and no-price states. Mobile flow requires no drag operation. Depends on verified phase 2 catalog. |
| 4 — Estimate and commercial review | Private versioned cost books; server estimator; quote requests/versions; staff review; customer quote view | Three operations-approved fixtures reconcile BOM to totals. Boundary quantities, missing cost, setup, rounding, expiry, stale estimates, and cross-project access pass. Phase may launch with manual review if approved rates remain incomplete. |
| 5 — Submission and dashboards | Spec/photo/sample intake; private upload lifecycle; project transaction; receipt; guest verification/claim; retrying notifications; customer timeline; staff queue | Browser journey persists project/files/quote reference and remains correct after reload. Duplicate submit creates one request. Failed upload/metadata/email paths are recoverable and do not fake success. Staff sees and can action the submitted project. |
| 6 — Sample loop | Real QR labels; scoped links; sample revision pages; verified feedback/approval; staff history; optional movements/sync adapter | A printed label decodes on mobile. Unknown/revoked links and unauthorized approval fail safely. Approval is tied to a revision. Inventory either persists successfully or explicitly remains outside scope. Depends on project/role foundation. |
| 7 — Advanced editor and exports | Optional freeform assembly graph, pointer/keyboard operations, undo/redo, production tech-pack PDF/JSON export | Diagram, saved configuration, BOM, PDF, and estimate agree for the same revision. Template placement works. Removing hardware resolves connections. Layout moves cannot silently change material usage. Implement only after guided-flow demand is demonstrated. |
| 8 — Migration and launch | Dry-run imports, old-to-new identifier mappings, URL redirects, catalog/asset reconciliation, operations training, monitoring and rollback plan | Reconcile counts and representative records; preserve old scan URLs through scoped aliases; validate downloads and project access; restore backup in staging; complete mobile/browser/accessibility/performance journeys. Choose cutover window, freeze affected writes, import deltas, verify, then release. |

Launch the core customer-to-staff workflow after phase 5 if advanced editing/scanning are not required for the initial audience. Do not block a useful guided service on a complete CAD editor. Do not retire existing sample URLs before phase 6 migration is ready.

## Verification for implementation and for this proposal

Future implementation tests should concentrate on business correctness: unit conversions and construction allowances; template → BOM consistency; price-tier boundaries and missing costs; owner/member/staff isolation; transactional submission and retry behavior; sample revision approval; and full browse → customize → submit → staff review journeys. Use a unit runner for pure domain logic, SQL tests for constraints/RLS, and Playwright for the actual user flows. Fixtures must be synthetic and checked for public-repository suitability.

For this docs-only proposal, the applicable checks are HTML validation, desktop/mobile rendering, content/links, palette contrast, and change-scope checks. See [BRAND.md](BRAND.md#preview-and-verification) for preview instructions and rendering results. The baseline app build/lint results above are recorded honestly; no existing app/config/package file was changed to make those results appear clean.

## Decisions still needed before implementation

- Who approves catalog specifications, costing, supplier routes, and lead times? Which assemblies can be quoted automatically?
- Is the first release owner-only, or must multiple buyers in a company collaborate? The proposed membership model supports either.
- Which sample fields are public, customer-specific, or internal, and which operations system owns inventory/status?
- What are the verified sample mailing address, contact destinations, response expectations, and file retention rules?
- Which of the three brand directions best fits the primary sales audience? The recommendation in [BRAND.md](BRAND.md) is a starting point, not an already approved identity.

These are implementation inputs, not blockers to reviewing this proposal. Payment processing, supplier commitments, AI services, production database changes, and deployment are intentionally unimplemented.
