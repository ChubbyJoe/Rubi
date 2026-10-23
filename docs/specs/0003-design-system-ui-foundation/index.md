# 0003. DESIGN.md tokens on shadcn/ui with two themed surfaces

**Date**: 2026-10-23
**Status**: In Progress

## Summary

Rubi's look comes from your existing `DESIGN.md` (Snow canvas, Rubi Madder, Satoshi, soft radii, a four tone status palette). This spec turns it into code: the colors, type and shapes become CSS variables that shadcn/ui components read, so every screen uses the same names instead of raw colors. There are two surfaces (looks): the Admin (the seller's back office, Rubi branded, dark when the phone is in dark mode) and the Shop (the customer's storefront, always light, ready for one seller chosen accent color in feature 13). The foundation also ships the base components and thin Admin and Shop shells, so Slice 1 features only build pages.

## Requirements

**User stories**:
- As a seller, I want the Admin to look calm, credible and consistent on my phone so that I trust Rubi with my business.
- As a customer, I want a shop that loads fast on slow mobile data and reads clearly so that I feel safe ordering.
- As a seller using a screen reader or keyboard, I want every control labelled, reachable and visibly focused.
- As the builder of features 5 to 17, I want tokens, base components and shells that already exist so that I only build pages and never invent colors or spacing.

**Acceptance criteria**:
- **AC-1**: A root `DESIGN.md` exists, copied from `../Ruby-design/DESIGN.md` (a sibling folder of the repo) and adapted for Rubi: naira examples written the way `formatNaira` prints them, MVP copy (WhatsApp handoff, manual payment, guest checkout), components outside the MVP tagged **Later** (card checkout, payouts, Rubi Promise, reviews, data table bulk actions, analytics charts), and this spec's token changes folded in (input border values, placeholder rule, completed dark palette, dark press state, destructive fill, the shadcn mapping table, the breakpoints, the 44px hit area rule), with its YAML front matter rewritten to the new values. Every token value in it matches `src/app/globals.css`, and a test checks that every hex in its front matter exists in `src/lib/design/tokens.ts`.
- **AC-2**: `src/app/globals.css` defines every `DESIGN.md` color role as a CSS variable under the shadcn names plus the Rubi extras in the token contract below, registers each in `@theme inline`, and defines the radius scale, the type scale utilities (`text-display-xl` and the rest), the float shadow, the shop and admin container widths, and breakpoints `md` 744px, `lg` 1128px, `xl` 1440px (`sm` stays at 640px so shadcn's generated `sm:` classes keep working; `2xl` removed, and any generated `2xl:` class rewritten to `xl:`).
- **AC-3**: Pages under `(auth)` and `/app` render the Admin surface; with the system set to dark, they render the dark tokens, including content in portals (menus, sheets, toasts). The marketing page, root not found and error pages render light Rubi tokens in either system mode. Storefront pages never render dark tokens.
- **AC-4**: `ShopShell` takes a `ShopTheme`. The default theme renders Madder with warm neutrals and emits no inline style. A non default theme emits one `<style>` with an `html:has([data-surface="shop"])` rule (specificity above the stone neutrals block, so the seller values always win) overriding the primary, primary active, primary foreground, ring and accent tint variables, and sets `data-neutrals="stone"` when its neutrals are stone. A theme value that is not a `#rrggbb` hex makes the shell fall back to the default theme, so no seller value ever reaches CSS unchecked.
- **AC-5**: Satoshi loads from one self hosted variable `woff2` through `next/font/local`, preloaded, with `display: swap` and a size adjusted fallback. No page requests a third party font host. A price from `formatNaira` renders its `₦` sign legibly (Satoshi or the fallback font).
- **AC-6**: These shadcn primitives (Radix base, maia style) are installed in `src/components/ui` and restyled to `DESIGN.md`: Button (primary, secondary as `outline`, tertiary as `ghost`, icon, compact size, solid destructive), Spinner, Field family with Label, Input, InputGroup (for the `₦` prefix), Textarea, NativeSelect, Badge, Card, Skeleton, Sonner, Empty, Separator, Alert, DropdownMenu, Sheet. Buttons and inputs are 48px tall with 12px radius, compact buttons 36px, cards 18px. Focus shows a solid 2px outline in `--ring` with a 2px offset; on an invalid field the error outline replaces the ring color and keeps the offset. Placeholders use the muted foreground. Error state shows a 2px error outline, an icon and a message. States: primary hover equals rest (press only, as `DESIGN.md` says) and press uses `--primary-active`; destructive hover and press use `--destructive-active`; disabled buttons use `--secondary` fill with `--muted-foreground` label. Overlays (Sheet, Dialog) use `bg-scrim` instead of `bg-black/50`. Any control drawn smaller than 44px has a 44px hit area through an inset `after:` pseudo element on a `relative` control, and adjacent compact controls keep at least an 8px gap so hit areas never overlap.
- **AC-7**: `StatusBadge` renders the four tones (success, info, attention, neutral), each with its icon and text label, using only status tokens (never primary or the shop accent).
- **AC-8**: The Admin shell renders a 248px sidebar at 1128px and wider, a 72px icon rail from 744px to 1127px, and a bottom tab bar under 744px. Nav items come from one typed config listing only routes that exist (Home now). The active item has `aria-current="page"` and, in the sidebar and rail, a 3px `--nav-indicator` bar at its left edge plus the `--secondary` fill. The bottom bar is 64px tall plus `env(safe-area-inset-bottom)` padding and adds a **More** sheet. The topbar shows the store name, a **View shop** link to `/s/<slug>` (new tab) only when the store is published, and an account menu with the seller's name, email and **Sign out**. The sidebar shows the `Wordmark`; the rail shows the dot mark alone. The shell owns the single `<main id="main">` landmark and a skip link to it; pages inside the shell render no `<main>` of their own. `/app/setup` renders the Admin surface without the shell, keeps its own `<main>`, and never loops between redirects.
- **AC-9**: The Shop shell renders a 72px header with the shop name (Satoshi 700, 20px, no logo yet) linking to `/s/<slug>`, and a footer with the **Powered by rubi** mark linking to `/sign-up`, inside a 1280px max width with 16px gutters below `md` and 32px from `md`. It owns the single `<main id="main">`; storefront pages render no `<main>` of their own. No file under `src/components/shop-shell/` or `src/components/brand/` carries `"use client"`.
- **AC-10**: A `Wordmark` component draws lowercase **rubi** in Satoshi 700 (tracking `-0.05em`) as "rub" plus a dotless `ı` in `--foreground`, with a round `#a31621` dot about 0.28em wide absolutely positioned over the stem; the text is `aria-hidden` and the element has `aria-label="Rubi"` (`role="img"`). If Satoshi lacks `ı`, the stem is a CSS bar instead. A `DotMark` renders the dot alone. The favicon `src/app/icon.svg` is a Madder dot on a transparent ground and `src/app/favicon.ico` is deleted. The Apple touch icon (180px) and manifest icons (192px, 512px) are a Madder dot centred on a Snow square (dot about 60% of the side); the 512px maskable icon keeps the dot within about 40% of the side. The manifest uses Snow for `background_color` and `theme_color`.
- **AC-11**: A Vitest unit test asserts every pair in the **Contrast pairs** list below reaches its threshold, across warm light, stone light, Admin dark and the sample stone theme, reading the values from `src/lib/design/tokens.ts`. A second test parses `globals.css` and checks each mirrored value matches `tokens.ts`. Changing a token below its threshold, or letting the two drift, fails the tests.
- **AC-12**: `/dev/ui` (Admin surface) and `/dev/ui/shop` (Shop surface, `?neutrals=stone` for a sample stone theme) render every primitive in its default, focus, error, disabled and loading states, plus the shells' parts and `StatusBadge`. Both return 404 when `VERCEL_ENV` is `production`. A Playwright test at 390 by 844 runs axe on Admin light, Admin dark (`page.emulateMedia({ colorScheme: "dark" })`), Shop warm and Shop stone and finds no serious or critical violations, and tabbing reaches every enabled control with a visible focus outline (disabled controls are skipped).
- **AC-13**: One sonner `Toaster` serves every Admin surface (not the storefront or the marketing page), mounted in the shared `AdminSurface` wrapper so a toast survives the move from `(auth)` to `/app`: bottom center, `--toast` fill and `--toast-foreground` text (light: #2a1a1d fill, Snow text; dark: Snow fill, #2a1a1d text; 15.66:1 both ways), auto dismiss after 5 seconds.
- **AC-14**: A `Skeleton` stays invisible for its first 300ms and then appears with a 1.6s shimmer; with reduced motion requested, it shows without the shimmer.

## Decision

**Chosen option**: Option 1: Map `DESIGN.md` onto shadcn's semantic tokens, switch surfaces with data attributes, ship thin shells now

`DESIGN.md` is the source of truth; its roles map onto shadcn's variable names (plus a few Rubi extras), shadcn runs on Radix with the maia style, the Admin and Shop surfaces are chosen by `data-surface` attributes matched with `html:has(...)` so portals inherit them, and the foundation builds tokens, primitives, brand assets and thin shells before feature 5.

**Implementation skills**: `shadcn` (`shadcn-ui/ui`, `.claude/skills/shadcn/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.claude/skills/vercel-react-best-practices/`) · `vitest` (`antfu/skills`, `.claude/skills/vitest/`) · `playwright-cli` (`microsoft/playwright-cli`, `.claude/skills/playwright-cli/`)

Read `.claude/skills/shadcn/design-system.md` (Step 4 token mapping, radius pinning, control heights) before restyling components.

## Feature design

### Surfaces

| Surface | Routes | Marker | Brand color | Neutrals | Dark |
|---|---|---|---|---|---|
| Admin | `(auth)/*`, `/app/*`, `/dev/ui` | `data-surface="admin"` on the shared `AdminSurface` wrapper used by each group's layout | Madder | warm | follows `prefers-color-scheme` |
| Shop | `/s/[storeSlug]/*` | `data-surface="shop"` (and `data-neutrals="stone"` for a custom accent) on the shop shell root | seller accent, default Madder | warm for the default accent, stone otherwise | never |
| Rubi light | `(marketing)`, root `not-found`, `error`, `global-error` | none | Madder | warm | never |

The markers sit on wrapper elements inside the shared root layout. Tokens hang on `html:has([data-surface="admin"])` and `html:has([data-neutrals="stone"])`, so Radix portals (rendered at the end of `body`) pick up the same tokens. Browsers without `:has()` fall back to the light warm tokens, which are fully usable.

CSS block order and specificity in `globals.css`:
1. `:root` warm light tokens plus `color-scheme: light`.
2. `html:has([data-neutrals="stone"])` stone neutrals and the stone shadow. It never sets `--primary*` or `--ring`.
3. `@media (prefers-color-scheme: dark) { html:has([data-surface="admin"]) { ...dark tokens; color-scheme: dark; } }`.
4. The seller theme, injected by `ShopShell` as `html:has([data-surface="shop"]) { ... }` (same specificity as block 2 and later in the document, so it wins).

`shadcn init` writes its own `@custom-variant dark (&:is(.dark *))`; replace it after init with the block form `@custom-variant dark { @media (prefers-color-scheme: dark) { html:has([data-surface="admin"]) & { @slot; } } }`.

### Token contract (`src/app/globals.css`)

The DESIGN.md role on the left; the CSS variable code uses on the right. Components use only these names (`bg-background`, `text-muted-foreground`, `border-input`), never a hex value or a Tailwind palette color.

| DESIGN.md role | Variable | Warm light | Stone light | Admin dark |
|---|---|---|---|---|
| canvas | `--background`, `--card`, `--popover` | #fcf7f8 | #fafaf9 | #1f1719 |
| ink | `--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground`, `--secondary-foreground` | #2a1a1d | #1c1917 | #f6eef0 |
| body | `--body` (extra) | #4a3539 | #44403c | #ddd0d3 |
| muted (text) | `--muted-foreground` | #6e5a5e | #57534e | #b8a7ab |
| muted soft (disabled text only) | `--muted-soft` (extra) | #9a888c | #a8a29e | #7d6a6e |
| surface soft | `--muted`, `--accent` (hover wash), `--sidebar` (the `--sidebar-*` set mirrors the matching main tokens) | #f6eef0 | #f5f5f4 | #2a2023 |
| surface strong | `--secondary`, `--surface-strong` (extra) | #f1e5e8 | #efedeb | #352a2d |
| hairline | `--border` | #eadcdf | #e7e5e4 | #3d3034 |
| hairline soft | `--hairline-soft` (extra) | #f2e8ea | #f0eeec | #33282b |
| border strong (inputs, selects, steppers, uploader edge) | `--input` | **#9a7f85** | **#8a8580** | **#8a767a** |
| focus | `--ring` | #2a1a1d | #1c1917 | #f6eef0 |
| primary / accent | `--primary` | #a31621 | seller accent | #c4303b |
| on primary | `--primary-foreground` | #fcf7f8 | derived (feature 13) | #fcf7f8 |
| primary active (press) | `--primary-active` (extra) | #7e1019 | derived (feature 13) | **#a8232d** |
| accent tint (decorative fills) | `--primary-tint` (extra) | #edb8bd | derived (feature 13) | #4a1418 |
| primary mid (charts only) | `--primary-mid` (extra) | #d4646d | n/a | #7e1f26 |
| error text, destructive fill | `--destructive` | #b45309 | #b45309 | #f0a868 |
| on destructive | `--destructive-foreground` (extra) | #fcf7f8 | #fcf7f8 | #1f1719 |
| destructive hover and press | `--destructive-active` (extra) | #92400e | #92400e | #f5bd8a |
| toast | `--toast` / `--toast-foreground` (extras) | #2a1a1d / #fcf7f8 | #1c1917 / #fafaf9 | #fcf7f8 / #2a1a1d |
| active nav bar | `--nav-indicator` (extra) | #a31621 | n/a | #d9505a (3.45:1 on the dark active fill; dark Madder #c4303b is only 2.88:1 on the sidebar) |
| scrim | `--scrim` (extra) | rgb(0 0 0 / 0.5) | same | rgb(0 0 0 / 0.6) |
| status success | `--status-success-foreground` / `--status-success` | #166534 / #e7f3ea | same | #4ade80 / 16% of it over canvas |
| status info | `--status-info-foreground` / `--status-info` | #1d4ed8 / #e8eefc | same | #93b4f5 / 16% |
| status attention | `--status-attention-foreground` / `--status-attention` | #92400e / #fbecdf | same | #f0a868 / 16% |
| status neutral | `--status-neutral-foreground` / `--status-neutral` | #6e5a5e / #f1e5e8 | #57534e / #efedeb | #b8a7ab / 16% |
| legal link | `--legal-link` (extra) | #2563eb | #2563eb | #93b4f5 |
| charts | `--chart-1` to `--chart-5` | #a31621, #4f86c6, #edb8bd, #d4646d, #7e1019 | n/a | #c4303b, #4f86c6, #4a1418, #7e1f26, #d9505a |

Bold values change `DESIGN.md`: input borders reach 3:1 (the old #d3c1c5 and #d6d3d1 were 1.62:1 and 1.43:1), and the dark press state darkens instead of lightening (Snow on #d9505a was 3.77:1). Placeholders use `--muted-foreground`; `--muted-soft` is for disabled text only. Dark status fills ("16%") are `color-mix(in srgb, <status text> 16%, var(--background))` in CSS, and `contrast.ts` exports the same sRGB blend so tests measure the real fill. Stone hairline soft (#f0eeec) is derived; `DESIGN.md` had no stone value for it.

**Contrast pairs** (the AC-11 test list; "text" needs 4.5:1, "boundary" needs 3:1). Run each in warm light, stone light and Admin dark unless marked:
- Text: `foreground`, `body`, `muted-foreground` on `background`, `muted`, `secondary`
- Text: `primary-foreground` on `primary` and on `primary-active`
- Text: `destructive` on `background`; `destructive-foreground` on `destructive` and on `destructive-active`
- Text: each `status-*-foreground` on its `status-*` fill (dark fills via the blend)
- Text: `toast-foreground` on `toast`; `legal-link` on `background`
- Text: `muted-foreground` on `background` (placeholders)
- Boundary: `input` on `background`, `muted` and `secondary`; `ring` on `background` and `muted`; `nav-indicator` on `muted` and `secondary` (warm light and Admin dark only)
- Sample stone theme: `onAccent` on `accent` and on `accentActive` (text); `ring` on stone `background` (boundary)
- Not tested (exempt): `muted-soft` (disabled text only), `primary-tint`, `primary-mid`, charts

**Other theme values** (in `@theme inline` or `@theme`):
- Fonts: `--font-sans: var(--font-satoshi), Inter, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif`.
- Type: one `--text-<token>` per `DESIGN.md` type token (`stat-display`, `display-xl`, `display-lg`, `price-lg`, `display-sm`, `title-md`, `title-sm`, `body-md`, `body-sm`, `table`, `caption`, `caption-sm`, `column-head`, `badge`, `button-md`, `button-sm`, `link`, `nav-link`), each with its `--line-height`, `--font-weight` and `--letter-spacing` sub variables. `stat-display`, `price-lg` and `table` are always used with `tabular-nums`.
- Radius: pin `--radius-xs` 6px, `--radius-sm` 12px, `--radius-md` 18px, `--radius-lg` 24px, `--radius-xl` 32px, and repoint the maia component classes so controls land on 12px and cards on 18px (shadcn skill, Radius).
- Spacing: Tailwind's default 4px scale already matches; `DESIGN.md` names map to numbers (`xxs` 0.5, `xs` 1, `sm` 2, `md` 3, `base` 4, `lg` 6, `xl` 8, `xxl` 12, `section` 16). No named spacing tokens, because names like `md` would collide with Tailwind's size utilities.
- Shadow: `--shadow-float` with the three layer value from `DESIGN.md`; under `data-neutrals="stone"` the last layer becomes `rgba(28, 25, 23, 0.08)`.
- Containers: `--container-shop` 80rem (1280px), `--container-admin` 75rem (1200px).
- Breakpoints: `--breakpoint-sm: initial`, `--breakpoint-md: 46.5rem`, `--breakpoint-lg: 70.5rem`, `--breakpoint-xl: 90rem`, `--breakpoint-2xl: initial`.
- Dark variant: `@custom-variant dark` scoped to `@media (prefers-color-scheme: dark)` plus `html:has([data-surface="admin"])`, so shadcn's own `dark:` classes fire only on the Admin. `color-scheme: dark` is set in the same block so native controls (NativeSelect, scrollbars) follow.

### Shop theme contract (feature 13 fills it)

`src/features/stores/shop-theme.ts`:

```ts
export type ShopTheme = {
  readonly accent: string;        // #rrggbb, becomes --primary
  readonly onAccent: string;      // --primary-foreground
  readonly accentActive: string;  // --primary-active
  readonly accentTint: string;    // --primary-tint
  readonly ring: string;          // accent when it reaches 3:1 on the canvas, else ink
  readonly neutrals: "warm" | "stone";
};

export const DEFAULT_SHOP_THEME: ShopTheme = { /* Madder values from the table, warm */ };

/** CSS for a non default theme, or null for the default or any invalid value. */
export function shopThemeCss(theme: ShopTheme): string | null;
```

`shopThemeCss` is pure: it returns `null` when the theme equals the default or any color fails `/^#[0-9a-f]{6}$/i`, else one `html:has([data-surface="shop"]){...}` rule setting `--primary`, `--primary-foreground`, `--primary-active`, `--primary-tint` and `--ring`. `ShopShell` renders it in a `<style>` element. When feature 13 stores themes, resolve the theme outside any Suspense boundary so the accent never flashes in after first paint.

The sample stone theme for `/dev/ui/shop?neutrals=stone` (a constant in the preview page): accent `#0f766e`, onAccent `#fafaf9` (5.24:1), accentActive `#0b5e58` (7.30:1), accentTint `#d0e2e0` (18% over stone canvas), ring `#0f766e` (5.24:1 on the canvas), neutrals `stone`. Deriving a theme from a seller's chosen color (contrast guard, auto darken, stone switch), storing it, and the picker are feature 13.

### Components and files

- `src/components/ui/*`: shadcn primitives listed in AC-6, restyled by editing their `cva` variants (keep variant names). Pending buttons compose `Spinner` with `disabled`.
- `src/components/status-badge.tsx`: `StatusBadge({ tone, children })`, icons from `lucide-react`: success `Check`, info `Clock`, attention `TriangleAlert`, neutral `Minus`. Mapping an order or payment state to a tone belongs to the feature that owns the state.
- `src/components/brand/wordmark.tsx` (`Wordmark`, `DotMark`) and `src/components/brand/powered-by.tsx`.
- `src/components/admin-surface.tsx`: `AdminSurface({ children })`, a server component rendering the `data-surface="admin"` wrapper and the one `Toaster` (a client component imported into it). Used by the `(auth)`, `/app` and `(dev)` layouts.
- `src/components/admin-shell/`: `admin-shell.tsx` (server, layout frame; the nav, rail and bottom bar render statically, and only the topbar identity, meaning store name, View shop and account menu, sits in Suspense with a fallback of the same fixed height), `nav.ts` (`ADMIN_NAV`, typed with `Route` and a `tab` flag for the bottom bar, at most 4 tabs), `nav-link.tsx` (client, `usePathname` for the active state), `account-menu.tsx` (client, DropdownMenu, moves the current sign out button here), `more-sheet.tsx` (client, Sheet with the non tab items, View shop and Sign out).
- `src/components/shop-shell/`: `shop-shell.tsx` (`ShopShell({ name, slug, theme, children })`), `shop-header.tsx`, `shop-footer.tsx`, all server components. The shell renders only for a resolved store; unknown slugs and the `__shell__` placeholder hit `notFound()` in `resolveStoreSlug` before the shell renders.
- Fonts: `src/app/fonts/Satoshi-Variable.woff2` plus its licence file, loaded in `src/app/layout.tsx` with `next/font/local` (`weight: "300 900"`, `display: "swap"`, `preload: true`, `adjustFontFallback: "Arial"`) as `--font-satoshi`, replacing Geist. If the font lacks `₦`, the fallback stack renders that glyph; note it in `DESIGN.md`.
- Brand assets: `src/app/icon.svg` (Madder dot), `src/app/apple-icon.png` (180px), `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, generated once from SVG sources with `sharp` (already installed with Next) by a one off command, then committed. Delete `src/app/favicon.ico`.
- Viewport: add `viewportFit: "cover"` to the root `viewport` export so the bottom tab bar can pad for the safe area in the installed PWA.
- Token values for tests: `src/lib/design/tokens.ts` exports the table above as constants; `src/lib/design/contrast.ts` holds the pure WCAG contrast function. `globals.css` mirrors the module by hand; the unit test reads the module, and a second test parses `globals.css` and checks each mirrored value matches.

### Routes

| Route file | Change |
|---|---|
| `src/app/layout.tsx` | Satoshi via `next/font/local`; no `Toaster` here |
| `src/app/(auth)/layout.tsx` (new) | `AdminSurface`, centered column, `Wordmark` |
| `src/app/(dashboard)/app/layout.tsx` | `AdminSurface` only; no data reads |
| `src/app/(dashboard)/app/(shell)/layout.tsx` (new) | `AdminShell`; store details read under Suspense |
| `src/app/(dashboard)/app/(shell)/page.tsx` | moved from `app/page.tsx`, same URL `/app`; drops its own `<main>` |
| `src/app/global-error.tsx` | renders its own `<html>`, so it imports `globals.css` itself and stays Rubi light |
| `src/app/(dashboard)/app/setup/page.tsx` | stays outside `(shell)`, so a seller without a store never hits `getSellerContext()` in a layout |
| `src/app/(storefront)/s/[storeSlug]/layout.tsx` (new) | `ShopShell` with `DEFAULT_SHOP_THEME`, the shop name and current slug, awaiting `params` under Suspense; `generateStaticParams` stays on the page; the page drops its own `<main>` |
| `src/app/(dev)/layout.tsx` (new) | `AdminSurface` for `/dev/ui`; the shop preview page renders `ShopShell` itself |
| `src/app/(dev)/dev/ui/page.tsx`, `.../dev/ui/shop/page.tsx` (new) | preview pages, `notFound()` when `VERCEL_ENV` is `production` (read through `@/lib/env`; add it to the env schema if absent); the shop page reads `searchParams` under Suspense |
| `src/app/(marketing)/page.tsx`, `not-found.tsx`, `error.tsx` | use `Wordmark`, `Button` and type tokens; stay Rubi light |
| `src/app/manifest.ts` | icons and Snow colors |

### Value sourcing

| Action | Value displayed | Source |
|---|---|---|
| Shop header | shop name | `stores.name`, added to the `resolveStoreSlug` select (already granted to `rubi_public` in migration 0005; cached under the existing tags) |
| Shop header | logo | none until feature 13; the name stands in |
| Shop shell | theme | `DEFAULT_SHOP_THEME` until feature 13 adds the columns |
| Powered by mark | link target | constant `/sign-up` |
| Admin topbar | store name, View shop href, whether to show it | `stores.name`, `stores.slug`, `stores.published_at`, added to the existing select inside `getSellerContext()` (one query, as now) and returned as `storeName`, `storeSlug`, `storePublished` |
| Account menu | seller name and email | `getSellerContext()` (Better Auth session) |
| Admin nav | items and order | `ADMIN_NAV` constant |
| Admin nav | active item | `usePathname()`; exact match for `/app`, prefix match for others |
| Admin surface | light or dark | `prefers-color-scheme` |
| Contrast test | thresholds | 4.5:1 for text, 3:1 for component boundaries (WCAG 2.2 AA) |
| Admin topbar | View shop href type | `` `/s/${storeSlug}` as Route `` (typed routes cast) |
| Preview pages | visible or 404 | `VERCEL_ENV` through `@/lib/env` |
| Preview shop page | stone sample theme | the pinned values under *Shop theme contract* |
| Icons | artwork | Madder dot SVG sources, `sharp` to PNG |

### Key invariants

- No component file contains a hex color or a Tailwind palette color class; colors come only from the token contract.
- One primary button per view. Prices are `foreground`, never `primary`. Status is never `primary` or the shop accent.
- The storefront ships no Admin only client code: no `Toaster`, no `DropdownMenu`, no `Sheet` until a storefront feature needs one.
- `DESIGN.md`, `globals.css` and `src/lib/design/tokens.ts` agree on every value.
- A seller supplied value reaches CSS only through `shopThemeCss`, which accepts `#rrggbb` only.

### Security model

No data access changes beyond reading three more `stores` columns inside the existing `getSellerContext()` query (as `rubi_app`, own store only) and `stores.name` through `withPublic` (already granted). The shop theme `<style>` is built only from validated hex values, closing CSS injection before feature 13 stores seller input. The preview pages hold no data and return 404 in production.

### Critical test scenarios

- Contrast: every pair in the token table meets its threshold in warm, stone and dark, verifies **AC-11**, **AC-6**
- Token drift: a value in `globals.css` differs from `tokens.ts`, the test fails, verifies **AC-1**, **AC-2**
- Dark portals: Admin in dark mode, open the account menu and More sheet, menu surfaces are dark, verifies **AC-3**
- Shop never dark: storefront with dark system setting renders light tokens, verifies **AC-3**
- Theme guard: `shopThemeCss` returns null for the default theme and for `accent: "red;}body{display:none"`, returns one `html:has([data-surface="shop"])` rule for the sample stone theme, and in the browser the stone preview's focus ring is the teal accent (not overridden by the stone block), verifies **AC-4**
- Toast in dark: a toast on Admin dark reads ink on Snow, verifies **AC-13**
- One main landmark: `/app` and a storefront page each have exactly one `main`, verifies **AC-8**, **AC-9**
- No third party fonts: storefront network log has no request outside the app origin for fonts, verifies **AC-5**
- Setup without store: a new seller lands on `/app/setup` with the Admin surface and no redirect loop, verifies **AC-8**
- Shell responsive: at 390px the bottom tab bar shows Home and More; at 900px the icon rail; at 1280px the sidebar; active item has `aria-current="page"`, verifies **AC-8**
- Storefront JS: no `"use client"` file under `shop-shell/` or `brand/`, verifies **AC-9**
- axe and keyboard on the four preview variants at 390 by 844, verifies **AC-12**, **AC-6**, **AC-7**
- Skeleton delay and reduced motion, verifies **AC-14**

## Standard definition

**Canonical pattern**:
```tsx
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { StatusBadge } from "@/components/status-badge";
import { formatNaira } from "@/lib/money";

<h1 className="text-display-xl">Orders</h1>
<p className="text-body-sm text-muted-foreground">Placed today</p>
<span className="text-price-lg tabular-nums">{formatNaira(order.totalKobo)}</span>
<StatusBadge tone="attention">Unpaid</StatusBadge>

<Field data-invalid={!!error}>
  <FieldLabel htmlFor="price">Price</FieldLabel>
  <InputGroup>
    <InputGroupAddon>₦</InputGroupAddon>
    <InputGroupInput id="price" inputMode="decimal" aria-invalid={!!error} />
  </InputGroup>
  <FieldError>{error}</FieldError>
</Field>
<Button>Save product</Button>
```

**Replaces**:
- Raw `<input className="rounded border px-3 py-2">` and hand rolled labels (the scaffold's auth and setup forms, replaced by features 5 and later)
- Ad hoc `text-2xl font-semibold` headings, use the type tokens
- Hex values, `bg-white`, `text-gray-500` style palette classes, and manual `dark:` color overrides
- Geist and the placeholder `--background` / `--foreground` block in `globals.css`

**Enforcement**:
- ESLint `no-restricted-syntax` in `eslint.config.mjs` on string literals in `className` and `cn()` calls that match an arbitrary hex (`-[#`) or a Tailwind palette color (`(bg|text|border|ring|outline|fill|stroke|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b`), with the message "Use a design token (see DESIGN.md)". Runs in lint staged and CI. It does not see `style={{ color: "#..." }}`; review catches those. Run `npm run lint` right after every `shadcn add` and repoint generated palette classes (`bg-black/50` to `bg-scrim`, `text-white` to a token).
- The contrast and token drift Vitest tests (AC-11).
- The axe Playwright test (AC-12).

**Rollout**: new code immediately. The only existing violations are the scaffold placeholder forms, which features 5 to 7 replace; they use no palette colors, so the lint rule passes on day one.

**Exceptions**: `src/app/icon.svg`, `src/app/manifest.ts`, the generated icon images, `src/lib/design/tokens.ts` and the `Wordmark` dot (Madder is the brand mark itself) may use literal hex values.

## Build plan

Tracer Bullet: milestone 1 proves one thin thread through every layer (font, tokens, one primitive, both surfaces on real routes, the contrast test). Each later milestone thickens one segment and ships end to end.

**Precondition (you, before `/develop`)**: download Satoshi from Fontshare, confirm its licence allows self hosting, and place `Satoshi-Variable.woff2` and the licence text in `src/app/fonts/`. The build cannot fetch it.

**Milestone 1: Thread (tokens to a real route on both surfaces)**
1. Copy `../Ruby-design/DESIGN.md` into the repo root and adapt it as AC-1 describes (naira, MVP copy, Later tags, this spec's token changes in prose and front matter, the mapping table), satisfies **AC-1**
2. Load Satoshi with `next/font/local` (options under *Components and files*) as `--font-satoshi`; remove Geist; add `viewportFit: "cover"`. Check the font covers `₦` (U+20A6) and dotless `ı` (U+0131); note the result in `DESIGN.md`, satisfies **AC-5**
3. `npx shadcn@latest init` with the Radix base and maia style into the existing app (`src/components/ui`, `@/` aliases, `lucide-react`); replace `globals.css` with the full token contract in the block order above, and replace shadcn's dark variant with the block form, satisfies **AC-2**, **AC-3**
4. `src/lib/design/tokens.ts`, `contrast.ts` (ratio and sRGB blend) and the Vitest contrast, `globals.css` drift and `DESIGN.md` front matter tests, satisfies **AC-11**, **AC-1**
5. Add Button and restyle it; build `AdminSurface` and use it in the `(auth)` and `/app` layouts, and use Button on the marketing page, so one token driven component renders on Rubi light and the Admin surface in light and dark, satisfies **AC-3**, **AC-6**

**Milestone 2: Primitives and status**
6. Add and restyle the rest of the AC-6 primitives (heights, radii, solid focus outline, hover, press, error and disabled states, muted placeholders, scrim overlays, 44px hit areas, Skeleton delay and reduced motion); run lint after each `shadcn add`; configure sonner in `AdminSurface` (bottom center, toast tokens, 5s), satisfies **AC-6**, **AC-13**, **AC-14**
7. `StatusBadge`, satisfies **AC-7**
8. ESLint `no-restricted-syntax` token rule, satisfies **AC-2**

**Milestone 3: Brand and shells**
9. `Wordmark`, `DotMark`, `PoweredBy`, `icon.svg`, Apple and manifest icons through `sharp`, delete `favicon.ico`, manifest colors; restyle marketing, not found, error and global error with them, satisfies **AC-10**, **AC-3**
10. Extend `getSellerContext()` with `storeName`, `storeSlug`, `storePublished` in its existing query (update the `SellerContext` type and its db tests); move `/app` into `(shell)`; build `AdminShell` (sidebar with active bar, icon rail, bottom tab bar with safe area, More sheet, topbar, account menu, skip link, the one `<main>`) from `ADMIN_NAV`, satisfies **AC-8**, **AC-13**
11. `shop-theme.ts` (`ShopTheme`, `DEFAULT_SHOP_THEME`, `shopThemeCss`) with unit tests; add `name` to `resolveStoreSlug`; build `ShopShell` and the `[storeSlug]/layout.tsx`, satisfies **AC-4**, **AC-9**

**Milestone 4: Preview and proof**
12. `(dev)` layout and the `/dev/ui` and `/dev/ui/shop` preview pages with every primitive and state, gated off in production, satisfies **AC-12**
13. Install `@playwright/test` and `@axe-core/playwright` (or reuse the `/test` setup if it lands first): `playwright.config.ts` with `webServer` running `npm run dev` and `baseURL` `http://localhost:3000`, a `test:e2e` script, and the mobile viewport axe and keyboard test across the four variants. It runs locally and in `/check verify`; CI adds it once CI has a database branch, satisfies **AC-12**

## Consequences

**Positive**:
- Every later feature composes existing components on named tokens; nobody picks a color, size or radius again.
- shadcn components keep their standard variable names, so new components from the CLI pick up Rubi's look with little restyling.
- Seller branding (feature 13) becomes a data problem: derive five values, pass a `ShopTheme`, done. The injection guard exists before seller input does.
- Storefronts stay light: one self hosted font file, no third party requests, no client JS from the shell.
- Contrast is tested, so a token tweak cannot silently break AA.

**Negative / tradeoffs**:
- Token values live in three places (`DESIGN.md`, `globals.css`, `tokens.ts`). The drift test guards the two code copies; `DESIGN.md` stays a manual sync.
- Code uses shadcn's names (`muted` is a surface, `muted-foreground` is text) while `DESIGN.md` uses its own (surface soft, muted). The mapping table bridges them, but it is one more thing to learn.
- `html:has()` surface switching depends on a modern browser; very old Android browsers get light warm tokens everywhere (usable, not dark).
- The Admin shell needs three more columns in `getSellerContext()`, which widens a function spec 0002 defined.
- Darker input borders change the soft look `DESIGN.md` intended; inputs read more defined than the original mockups.
- Playwright and axe add dev dependencies and CI time.

**Neutral**:
- `/app` moves into a `(shell)` route group; the URL does not change.
- Geist is removed; `lucide-react`, `sonner`, Radix packages, `class-variance-authority`, `tailwind-merge`, `clsx` and `tw-animate-css` arrive with shadcn init.
- The dark Madder press state and destructive fill differ from `DESIGN.md`'s original values, recorded in the adapted copy.

## Follow-up

- [ ] Store branding spec (feature 13): `deriveShopTheme(accent)` (on accent label, auto darken, active, tint, ring 3:1 rule, stone switch, ΔE status check), the theme and logo columns plus their `rubi_public` grants, the theme picker, the shop favicon (first letter on the accent), and `updateTag` for `store:<id>`.
- [ ] Seller sign up spec (feature 5): rebuild the auth and setup forms on Field, Input and Button; decide React Hook Form usage with the Field components (spec 0001 names it).
- [ ] Public storefront spec (feature 7): product card, product page layout and checkout on these tokens; whether the storefront needs its own toast.
- [ ] Add a product spec (feature 6) adds its nav item to `ADMIN_NAV`; Orders inbox (feature 8) adds Orders with the count pill.
- [ ] Add the Playwright suite to CI once CI runs against a Neon branch.
- [ ] `/sync`: add a `DESIGN.md` pointer and the token rule (no hex or palette classes, use `StatusBadge`, prices in foreground) to root `AGENTS.md`; record the declined Agent Skill and MCP search for `lucide-react`, `sonner` and `@axe-core/playwright`.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
