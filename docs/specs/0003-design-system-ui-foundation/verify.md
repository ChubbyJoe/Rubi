# Verify: Design system & UI foundation · spec 0003 · updated 2026-10-23
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open `/` with the system in dark mode → the page stays light (Snow canvas, Madder primary button, Satoshi) → AC-3, AC-5
- [ ] Open `/sign-in` with the system in dark mode → dark warm canvas (#1f1719), light ink, `rubi` wordmark with Madder dot → AC-3, AC-10
- [ ] Sign in as `ada@seed.rubi.test` (seed password) at 390px → bottom tab bar with Home and More, 64px plus safe area, Home has `aria-current="page"` → AC-8
- [ ] Same session at 900px → 72px icon rail with the dot mark, active item has the 3px nav indicator bar and secondary fill → AC-8
- [ ] Same session at 1280px → 248px sidebar with the wordmark, topbar shows "Ada's Fabrics", **View shop** (opens `/s/ada-fabrics` in a new tab), account menu → AC-8
- [ ] Unpublish the store (seed branch), reload `/app` → **View shop** is gone from the topbar and the More sheet → AC-8 (value: `stores.published_at`)
- [ ] Rename the store on the dev branch, reload `/app` → topbar shows the new name → AC-8 (value: `stores.name` via `getSellerContext`)
- [ ] Dark mode, open the account menu and the More sheet → both render dark tokens (portals) → AC-3
- [ ] Account menu shows the seller's name and email; **Sign out** returns to `/sign-in` → AC-8
- [ ] `/app` has exactly one `<main id="main">`; Tab once → **Skip to content** appears and jumps to it → AC-8
- [ ] Sign up a new seller (no store) → lands on `/app/setup`, Admin surface, no redirect loop → AC-8
- [ ] Open `/s/ada-fabrics` in dark mode → light shop, 72px header with "Ada's Fabrics" (Satoshi 700, 20px) linking home, **Powered by rubi** footer linking `/sign-up`, one `<main>` → AC-3, AC-9 (value: `stores.name` via `resolveStoreSlug`)
- [ ] Network panel on `/s/ada-fabrics` → no font requests outside the app origin; one Satoshi woff2 preloaded → AC-5
- [ ] A naira price (`/dev/ui`, Surfaces card) shows `₦48,000.00` legibly (₦ from the fallback font) → AC-5
- [ ] `/dev/ui` → every primitive in default, focus, error, disabled and loading states; buttons and inputs 48px, compact 36px, cards 18px radius → AC-6, AC-12
- [ ] `/dev/ui`, click **Show toast** in light and dark → bottom center, ink on Snow in dark, Snow on ink in light, gone after 5s → AC-13
- [ ] `/dev/ui` Loading section, reload → skeletons invisible for 300ms, then shimmer; with reduced motion on, no shimmer → AC-14
- [ ] `/dev/ui/shop?neutrals=stone` → stone neutrals, teal primary and teal focus ring; one inline `<style>` with an `html:has([data-surface="shop"])` rule; `/dev/ui/shop` has no inline style → AC-4
- [ ] Favicon is the Madder dot; `/manifest.webmanifest` lists the 192, 512 and maskable icons with Snow background and theme colors → AC-10
- [ ] Inspect the wordmark → `role="img"`, `aria-label="Rubi"`, text `aria-hidden`; the dot stays Madder in dark mode → AC-10

## Commands
- [ ] `npm test` → contrast, token drift, DESIGN.md front matter, `cn`, and `shopThemeCss` suites pass → AC-1, AC-2, AC-4, AC-11
- [ ] Change a token in `globals.css` only (e.g. `--input`) and run `npm test` → drift test fails; restore → AC-11
- [ ] `npm run test:db` → `resolveStoreSlug` returns `name` as `rubi_public` → AC-9
- [ ] `npm run test:e2e` → axe (no serious or critical) and keyboard focus pass on Admin light, Admin dark, Shop warm, Shop stone at 390 by 844 → AC-12
- [ ] `npm run lint` with `className="text-gray-500"` added anywhere in `src/` → "Use a design token (see DESIGN.md)" → AC-2
- [ ] `grep -rl '"use client"' src/components/shop-shell src/components/brand` → no output → AC-9
- [ ] `VERCEL_ENV=production npx next dev -p 3001`, request `/dev/ui` and `/dev/ui/shop` → 404 → AC-12
- [ ] `ls src/app/favicon.ico` → missing → AC-10

## Acceptance-criteria coverage
- AC-1 DESIGN.md front matter test, drift test · AC-2 drift test, lint step · AC-3 dark mode steps on `/`, `/sign-in`, portals, shop · AC-4 stone preview step, `shopThemeCss` tests · AC-5 font network and ₦ steps · AC-6 `/dev/ui` primitives step, e2e · AC-7 `/dev/ui` status badges, e2e axe · AC-8 shell steps at 390, 900, 1280, setup step · AC-9 shop step, `use client` grep, db test · AC-10 wordmark, favicon, manifest steps · AC-11 contrast and drift tests · AC-12 e2e, production 404 step · AC-13 toast step · AC-14 skeleton step
