# 0003. Design system and UI foundation: rationale

Decision record for [index.md](index.md). `/develop` builds from the index; this file explains why.

## Context

Rubi has two audiences on one codebase. Sellers run their business from the Admin, often on a mid range Android phone, many times a day. Customers land on a Shop from a WhatsApp or Instagram link, usually on slow mobile data, and decide in seconds whether the shop looks trustworthy enough to order from. Both need to feel professional, and the shops need to feel like the seller's own while staying fast and accessible.

A detailed `DESIGN.md` already exists outside the repo: palette, type scale, radii, spacing, components for both surfaces, a one color seller theme with contrast guardrails, and a dark palette for the Admin. It was written partly for an earlier marketplace, so its copy uses dollars, card checkout, payouts and reviews, none of which are in Rubi's MVP (naira, manual payment, WhatsApp handoff). Its dark palette is incomplete, and a few of its pairs fall short of the WCAG AA rule in `AGENTS.md`: input outlines at 1.62:1, placeholders at 3.2:1 and 2.4:1, and a dark press state at 3.77:1.

Spec 0001 already fixed Tailwind CSS v4 and shadcn/ui on Radix, Cache Components with cached storefronts, and no third party runtime cost on storefronts. Today `globals.css` holds placeholder tokens, Geist is the font, shadcn is not initialised, and every page uses ad hoc classes. Seventeen features are queued. Without a decided foundation, each will invent its own colors, sizes and shells, and the seller branding feature (13) will have no contract to plug into.

One person builds Rubi, Tracer Bullet style. Whatever is set up must be cheap to keep consistent: one place to change a token, automated checks that catch drift and contrast regressions, and no tooling that needs its own upkeep.

## Options considered

### Option 1: Map DESIGN.md onto shadcn's semantic tokens, surfaces by data attribute, thin shells now

Keep shadcn's variable names (`--background`, `--primary`, `--muted-foreground`) and point them at `DESIGN.md` values, adding a few Rubi extras (status tones, `--body`, `--primary-active`). Pick the surface with `data-surface` markers matched through `html:has(...)`, so the Admin can go dark and the Shop can take a seller accent while portals inherit. Build tokens, primitives, brand assets and thin Admin and Shop shells before feature 5.

**Pros**:
- shadcn components and future CLI additions work unchanged on Rubi's look.
- Surfaces switch with plain CSS: no JavaScript, no flash, works with cached storefront pages.
- Slice 1 features only build pages; shells and primitives are decided once.

**Cons**:
- Two vocabularies (shadcn names in code, `DESIGN.md` names in prose) need a mapping table.
- Relies on `:has()`; older browsers fall back to light warm tokens.
- More work before feature 5 than tokens alone.

### Option 2: Rename everything to DESIGN.md's vocabulary

Replace shadcn's variable names with `DESIGN.md` roles (`--canvas`, `--ink`, `--surface-soft`) and edit every installed component to use them.

**Pros**:
- One vocabulary everywhere; code reads like the design doc.

**Cons**:
- Every shadcn component needs edits now and on every update; CLI additions arrive broken.
- Agents and docs that assume shadcn names will write wrong classes.

### Option 3: Separate root layouts per surface

Give `(dashboard)`, `(storefront)` and `(marketing)` their own root layouts, each setting attributes on its own `<html>`.

**Pros**:
- No `:has()`; the surface is on `<html>` directly.
- Each surface can load only its own CSS and providers.

**Cons**:
- Moving between surfaces is a full page reload, and the root `not-found`, `error` and `global-error` setup has to be rebuilt per root.
- Three root layouts to keep in step for metadata, fonts and viewport.

### Option 4: Tokens and primitives only, shells per feature

Ship tokens and primitives now; feature 5 builds the Admin shell and feature 7 the Shop shell.

**Pros**:
- Smallest foundation; shells are shaped by the first page that needs them.

**Cons**:
- Shell decisions (navigation, responsive behaviour, setup page handling, theme injection) get made inside unrelated feature work, under pressure.
- Features 5 and 7 grow and are harder to verify.

## Rationale

Option 1 wins because it keeps the two things that are expensive to change, the token contract and the surface mechanism, standard and boring. shadcn's variable names are what its components, its CLI and every agent skill expect; renaming them (Option 2) buys a nicer vocabulary at the cost of editing every component forever. The mapping table in `DESIGN.md` is a one time learning cost.

The `data-surface` plus `html:has()` mechanism solves the real problem Option 3 targets (portals rendering outside the surface wrapper) without splitting the root layout. It is pure CSS, so cached storefront pages need no cookie or header to pick their look, and the Admin dark mode costs no JavaScript and shows no flash. The fallback on old browsers is the light theme, which is the correct look for most pages anyway.

Building thin shells now (over Option 4) follows the Tracer Bullet approach: the foundation is the first segment every slice runs through, and the shells carry decisions (the setup page redirect loop, theme injection, the Toaster staying off storefronts) that are easy to get wrong inside a feature. The shells stay thin: only Home in the nav, only the shop name in the header.

### Smaller decisions

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Design source | Your existing `DESIGN.md`, adapted into the repo root | It already settles the look in detail; the repo root is where shadcn and agents look | `docs/design.md` |
| Dark mode | Admin only, follows the system | Matches `DESIGN.md`; shops stay light so seller accents are checked on one canvas | Light only everywhere |
| Dark switch | `prefers-color-scheme` only | Pure CSS, nothing stored, no flash | Toggle in a cookie |
| Seller branding prep | `ShopTheme` contract and injection guard now, derivation in feature 13 | No unused color math now; the security guard exists before seller input | Derivation now |
| Component base | Radix | Already in spec 0001; mature; sonner for toasts | Base UI |
| shadcn style | maia | Closest geometry: 48px controls, 12px controls radius, 18px cards, generous padding | luma (pill buttons) |
| Font loading | One self hosted variable `woff2` via `next/font/local` | No third party request or render blocking CSS on slow networks; one file covers 400 to 700 | Four static weights |
| Breakpoints | 744, 1128, 1440 as `md`, `lg`, `xl` | `md:` means exactly what `DESIGN.md` calls tablet | Tailwind defaults |
| Placeholders | Muted foreground (6.0:1) | Meets 4.5:1; muted soft kept for disabled text, which WCAG exempts | No placeholders |
| Input borders | Darken to 3:1 | WCAG 1.4.11; inputs share the canvas fill, so the outline is their only boundary | Filled inputs |
| Dark gaps | Derived in this spec, each measured | Completes the palette without blocking on a design pass | Defer dark mode |
| Dark press state | #a8232d (darker) | `DESIGN.md`'s lighter #d9505a puts Snow text at 3.77:1 | Ink label on the lighter red |
| Destructive button | Solid error fill with Snow label (4.73:1) | A soft 10% tint left the label at 4.16:1 | Outline style |
| Tap targets | Visual sizes from `DESIGN.md`, 44px hit area through an inset pseudo element on smaller controls | Keeps the design's 36px and 40px controls and meets the `AGENTS.md` 44px rule | Make every control 44px tall |
| Select | shadcn NativeSelect | The phone's own picker, no JS, best with screen readers | Radix Select |
| Icons | `lucide-react` | shadcn default, tree shaken, stroke style matches | Phosphor |
| Toasts | sonner in Admin layouts only | Keeps toast JS off storefronts | Root layout `Toaster` |
| Wordmark | Built in code (text plus drawn dot) | No asset dependency; swap for an SVG anytime | Supplied SVG |
| PWA icons | Generated once from `icon.svg`, committed | Static files, no build step or runtime image generation | `ImageResponse` routes |
| Surfaces for auth and setup | Admin surface | They are the seller's first Admin screens | Light only until `/app` |
| Admin nav | Only routes that exist | No dead links; each feature adds its item | All items with a Soon state |
| Store details for the shell | Widen `getSellerContext()`'s existing select | One query per request, as now | A separate `getSellerStore()` query |
| Spacing tokens | Tailwind's numeric scale, mapped in `DESIGN.md` | Named spacing like `md` collides with Tailwind's size utilities | Named spacing variables |
| Verification | Vitest contrast and drift tests, dev preview pages, Playwright with axe at mobile size | Automated, cheap, no Storybook to maintain | Contrast test only |
| Lint enforcement | ESLint `no-restricted-syntax` on hex and palette classes | No new plugin; fails in lint staged and CI | `eslint-plugin-better-tailwindcss` |

### Contrast evidence

Measured with the WCAG 2.x relative luminance formula. Text needs 4.5:1; component boundaries need 3:1.

| Pair | Ratio |
|---|---|
| Ink on Snow | 15.66 |
| Muted on Snow / on surface soft / on surface strong | 6.02 / 5.60 / 5.21 |
| Snow on Madder | 7.35 |
| Snow on Madder active | 10.02 |
| Error text on Snow / on stone canvas | 4.73 / 4.81 |
| Status success / info / attention / neutral on their fills | 6.25 / 5.77 / 6.13 / 5.21 |
| Snow on ink (toast) | 15.66 |
| Input border warm on Snow / on surface soft | 3.44 / 3.20 |
| Input border stone on stone canvas / on stone surface soft | 3.50 / 3.35 |
| Stone ink / stone muted on stone surface soft | 16.74 / 6.99 |
| Dark: ink on canvas / on surface strong | 15.40 / 12.11 |
| Dark: body / muted on canvas | 11.75 / 7.66 |
| Dark: Snow on Madder #c4303b / on press #a8232d | 5.17 / 6.73 |
| Dark: input border on canvas / on surface strong | 4.15 / 3.26 |
| Dark: error text #f0a868 on canvas | 8.79 |
| Dark: status text on 16% fills (success, info, attention, neutral) | 7.26 / 6.21 / 6.42 / 5.74 |
| Dark: legal link on canvas | 8.44 |
| Dark: ink on Snow toast | 15.66 |
| Destructive active: Snow on #92400e / dark ink on #f5bd8a | 6.68 / 10.49 |
| Nav bar: Madder on surface soft / dark #d9505a on dark active fill | 6.83 / 3.45 |
| Sample stone theme: #fafaf9 on #0f766e / on #0b5e58 | 5.24 / 7.30 |
| Rejected: dark Madder #c4303b as nav bar on dark sidebar | 2.88 |
| Rejected: Snow text on an ink fill in dark mode (ink flips light) | unreadable |
| Rejected: old input border warm / stone | 1.62 / 1.43 |
| Rejected: placeholder muted soft warm / stone | 3.2 / 2.41 |
| Rejected: Snow on dark press #d9505a | 3.77 |
| Rejected: error text on a 10% error tint | 4.16 |
## Corrections recorded during the build (2026-10-23)

`/develop` found these while building; each was confirmed with you, then folded into `index.md`.

- **Warm input border #9a7f85 → #987d83.** The original reached 3.44:1 on the canvas but only 2.98:1 on `secondary`, failing the spec's own "input on secondary" pair. A small darkening to #987d83 passes everywhere (3.54, 3.29, 3.06:1).
- **`sm` breakpoint kept at 640px.** The token list said `--breakpoint-sm: initial` while AC-2 said `sm` stays at 640px. AC-2 is right: shadcn's generated classes use `sm:`.
- **Admin preview layout moved to `(dev)/(admin)/layout.tsx`.** One `(dev)` layout wrapping both previews would put the shop preview inside the Admin surface, so the `html:has(...)` dark tokens would apply to it.
- **Scaffold forms did use a palette color** (`text-red-600`). They now use `text-destructive`, so the lint rule still passes.
- **`getSellerContext` has no db test** to update; it reads request headers. Its three new fields are checked through the Admin topbar in `verify.md`.
- **`cn` package.** shadcn init now installs the `cn` npm package instead of `clsx` plus `tailwind-merge`. The `@/lib/utils` wrapper uses `createCn` from `cn/config` with the type tokens registered as font sizes, and generated components are repointed to that wrapper.
- **Font licence.** The Fontshare licence forbids redistribution, including through a repository, so the repository has to stay private while it holds the woff2.
- **Sample stone theme** lives in `tokens.ts`, not in the preview page, so the contrast test and the page share one source.

