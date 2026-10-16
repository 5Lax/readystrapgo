# Strap customizer v2

Open `/builder`. The flow covers material, exact width, cut length, color, buckle, end finish, woven-label text, quantity, and review. A dimensioned SVG, regional estimate, JSON specification, printable tech pack, and project intake all use the same state.

## Run

```sh
npm install
npm run dev
# http://localhost:3000/builder
```

No environment file is needed for design/export: an unconfigured checkout uses a visibly labeled snapshot of `supabase/migrations/005_seed_catalog_data.sql`. It never pretends a preview-catalog project was saved.

For live data and submission, supply `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` through the deployment/runtime environment. The database needs the catalog migrations and the existing project intake backend described below. Do not put credentials into source control.

```sh
npm run lint
npm run build
npm test
npm run test:browser
```

The browser suite starts a local HTTP fixture on `127.0.0.1:4329` and Next dev on port `3200`; stop another dev process in this worktree first. It uses locally installed Google Chrome by default. To use Playwright Chromium instead, run `npx playwright install chromium` and `PLAYWRIGHT_CHANNEL=chromium npm run test:browser`. The fixture is used only by tests. No test sends a production project, email, or external message. PDFs, screenshots, and failure traces go into ignored `.next/customizer-test-results/`.

## Pricing and dimensions

- `quote-engine.ts` extracts the original `calculateQuote` arithmetic. The original server action now delegates to it; `pricing.ts` adapts mm configuration to that same function. Browser display, JSON, print, and intake share it.
- Existing catalog price tiers, regional labor/tooling, volume discounts and shipping rates are retained. Hardware weight is now included in shipping. Missing regional webbing rates are unavailable, missing parts are errors, and the larger of regional/material MOQs applies.
- New finishing estimates are explicit constants: folded ends $0.15/strap, sewn loops $0.30/strap, woven labels $0.25/strap plus $35 setup. They are provisional allowances, not verified supplier prices. These additions are outside the legacy volume discount base. Heat sealing is included in assembly.
- Length is **total cut webbing length**, including turnbacks, before assembly. A single ply is shown. Folded ends reserve 15 mm per end; loops reserve 40 mm per end. The drawing shows a flat pattern, not a finished circumference or an assembly/load certification.
- One SVG user unit equals one mm on both axes. The whole drawing scales uniformly to its viewport. It is not printed at physical 1:1 size. Zoom preserves the geometry and allows scrolling. The buckle is drawn separately with a labeled 16 mm layout gap; that gap is not material and is not priced.
- Catalog widths remain exact conversions: 0.75 inch = 19.05 mm; 1 inch = 25.4 mm; 1.5 inch = 38.1 mm. They are not silently rounded to nominal 20/25/38 mm widths.
- Material/width changes clear incompatible buckles and reset unavailable colors with an announcement. Cam buckles are excluded for elastic; UHMWPE stock buckle combinations require custom review and use folded/loop ends. These are conservative offering rules, not claims of certified compatibility.
- Unit prices are rounded for display. Order totals come from the engine's unrounded calculations, not the displayed unit price multiplied back out.

## Replace buckle artwork without component changes

`BuckleAsset` is declared in `src/lib/customizer/types.ts`. The data registry is `src/lib/customizer/buckles.json`, keyed by hardware SKU. Seven placeholder SVGs are in `public/customizer/buckles/`. They are schematics, not manufacturer drawings.

To replace an existing drawing, replace its SVG at the same URL. To add a new SKU, add an entry to the JSON registry and its SVG file. No React or geometry changes are needed. Update the registry's fallback viewBox/anchors when geometry changes; `npm test` checks these against the SVG.

The SVG contract:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="56mm" height="33.4mm" viewBox="0 0 56 33.4">
  <rect id="body" x="3" y="1" width="50" height="31.4" rx="4" />
  <rect id="button" x="24" y="12" width="8" height="9" />
  <circle id="anchor-left" cx="0" cy="16.7" r="0.1" fill="none" />
  <circle id="anchor-right" cx="56" cy="16.7" r="0.1" fill="none" />
</svg>
```

Use mm-valued coordinates, a finite positive root viewBox, and root-coordinate anchors on the same horizontal axis (right.x > left.x). Put anchors inside the viewBox; do not transform the anchor circles. `widthMm` in the registry is the compatible slot width, not artwork height. The loader reads the SVG's viewBox and anchor positions at runtime, including a nonzero viewBox origin. The diagram places the part using those anchors.

`recolorableIds` reserves IDs such as `body` and `button` for future finish controls. This version preserves SVG colors. Artwork is rendered as an SVG image, never injected as HTML; keep images self-contained for print. Failed fetches, invalid metadata, unknown SKUs, and missing parts produce a readable fallback instead of a white screen. A React boundary also protects the drawing and customizer, and a route boundary handles server/render failures.

## Submission contract and backend prerequisite

`src/app/builder/actions.ts` reloads the live catalog, validates the entire configuration and contact details, reprices it on the server, and rejects stale/tampered totals. On a price change, the client refreshes the estimate while retaining selections, so the customer can review it and resubmit.

It uses the same authenticated/anonymous Supabase client and `generate_sample_number` → `projects` insert contract as `src/app/upload/page.tsx`. The complete versioned JSON spec, including BOM, configuration, quote breakdown, source and length definition, is saved in `projects.notes`; `description` contains a readable summary. The spec is part of the same insert, so there is no separate attachment upload that can fail after saving the project. Success is displayed only after a successful insert. Double clicks are guarded while a request is pending; failures keep the design and contact fields for retry.

**Existing repository gap:** migrations here do not define `projects`, `project_files`, or `generate_sample_number`, although `/upload` already uses them. This change does not invent a competing project schema or alter deployed row policies. The database must supply that existing intake contract and permit its established anonymous/authenticated insert flow. No service key or RLS bypass is introduced. Production persistence remains unverified without the real configured backend; the browser suite verifies the full client → server action → Supabase HTTP contract against a local fixture, including failure and retry.

JSON export is a real Blob download. “Print / PDF” opens a dedicated, current-state tech pack; “Print or save PDF” opens the browser print dialog. Choose Save as PDF there. No outbound email is sent.

## Source reuse and scope

`BROKEN.md` records the verified baseline failures with revision-specific source references. V2 adapts StrapBuilder's template starting lengths, physical units and anchor concept. Its divergent pricing and canvas implementation are not copied. Catalog options and baseline prices come from ReadyStrapGo's seed migration and, when connected, its live catalog.

Outside the requested builder/component/logic folders, changes are limited to:

- `src/lib/actions/catalog.ts`: delegate the existing server quote action to the shared engine; extend quote types and exclude inactive parts.
- `src/lib/supabase/middleware.ts`: let public pages render without credentials in seed mode.
- `public/customizer/buckles/`: SVG files served by Next's static asset route.
- `package.json`, `package-lock.json`, `vitest.config.mts`: npm test tooling and browser regression suite.
- `docs/customizer/`: audit and handoff documentation.
- `src/app/contact/page.tsx`, `src/app/dashboard/page.tsx`: escape existing JSX punctuation errors required to pass lint.
- `src/app/scan/[code]/scan-landing-client.tsx`: hoist the existing sample card/status map out of render to fix pre-existing React lint errors; make its padding classes static.

No reference-clone edits, environment files, commits, pushes, or git configuration changes were made.

## Verified in this worktree

On 2026-10-16: `npm run lint` passed (six existing warnings in unrelated photos/signup/upload code); `npm run build` passed without an environment file; `npm test` passed 37 unit tests; `npm run test:browser` passed 10 browser tests across desktop and 375px mobile. The tests exercised every step, exact SVG dimensions, compatible/disabled hardware, minimums, JSON contents, one-page A4 PDF output, missing artwork/templates, catalog outage, matching submitted/displayed prices, successful local-fixture persistence, and failed inserts with retry. No browser page errors occurred in the complete flow. The original builders were exercised before replacement, as recorded in `BROKEN.md`.
