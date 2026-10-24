---
version: 1.0
name: Rubi
description: A storefront and order book for small Nigerian sellers who sell on WhatsApp, Instagram and TikTok. Two surfaces share one system. The Shop (customer facing, light only, themed with one seller accent that defaults to Rubi Madder #a31621) and the Admin (the seller's back office, always Rubi branded, dark when the phone is in dark mode). Both sit on a warm Snow canvas (#fcf7f8), run Satoshi at modest weights, and use soft radii (12px controls, 18px cards, pill badges). Status has its own four tone palette that never borrows the accent.
source: adapted from ../Ruby-design/DESIGN.md by spec 0003
tokens: src/app/globals.css (CSS), src/lib/design/tokens.ts (tests)

colors:
  # Platform brand: Admin, Rubi pages, the "Powered by rubi" mark
  primary: "#a31621"
  primary-active: "#7e1019"
  primary-tint: "#edb8bd"
  primary-mid: "#d4646d"
  on-primary: "#fcf7f8"
  # Warm neutrals: Admin, Rubi pages, shops on the default accent
  ink: "#2a1a1d"
  body: "#4a3539"
  muted: "#6e5a5e"
  muted-soft: "#9a888c"
  hairline: "#eadcdf"
  hairline-soft: "#f2e8ea"
  border-strong: "#987d83"
  canvas: "#fcf7f8"
  surface-soft: "#f6eef0"
  surface-strong: "#f1e5e8"
  # Stone neutrals: shops with a custom accent
  stone-ink: "#1c1917"
  stone-body: "#44403c"
  stone-muted: "#57534e"
  stone-muted-soft: "#a8a29e"
  stone-hairline: "#e7e5e4"
  stone-hairline-soft: "#f0eeec"
  stone-border-strong: "#8a8580"
  stone-canvas: "#fafaf9"
  stone-surface-soft: "#f5f5f4"
  stone-surface-strong: "#efedeb"
  # Status: never the accent, never Madder
  status-success-text: "#166534"
  status-success-bg: "#e7f3ea"
  status-info-text: "#1d4ed8"
  status-info-bg: "#e8eefc"
  status-attention-text: "#92400e"
  status-attention-bg: "#fbecdf"
  status-neutral-text: "#6e5a5e"
  status-neutral-bg: "#f1e5e8"
  error-text: "#b45309"
  error-active: "#92400e"
  on-error: "#fcf7f8"
  toast: "#2a1a1d"
  on-toast: "#fcf7f8"
  legal-link: "#2563eb"
  chart-compare: "#4f86c6"
  scrim: "rgb(0 0 0 / 0.5)"

dark:
  # Admin only. Shops are never dark.
  canvas: "#1f1719"
  surface-soft: "#2a2023"
  surface-strong: "#352a2d"
  hairline: "#3d3034"
  hairline-soft: "#33282b"
  border-strong: "#8a767a"
  ink: "#f6eef0"
  body: "#ddd0d3"
  muted: "#b8a7ab"
  muted-soft: "#7d6a6e"
  primary: "#c4303b"
  primary-active: "#a8232d"
  primary-tint: "#4a1418"
  primary-mid: "#7e1f26"
  on-primary: "#fcf7f8"
  nav-indicator: "#d9505a"
  error-text: "#f0a868"
  error-active: "#f5bd8a"
  on-error: "#1f1719"
  toast: "#fcf7f8"
  on-toast: "#2a1a1d"
  status-success-text: "#4ade80"
  status-info-text: "#93b4f5"
  status-attention-text: "#f0a868"
  status-neutral-text: "#b8a7ab"
  status-bg: "16% of the status text over the canvas"
  legal-link: "#93b4f5"
  scrim: "rgb(0 0 0 / 0.6)"

theme:
  # Set per seller (feature 13). Defaults to the platform brand.
  accent: "{colors.primary}"
  accent-active: "derived, accent at OKLCH L minus 0.08"
  accent-tint: "derived, 18% accent over canvas"
  on-accent: "derived, Snow or ink, whichever contrasts more"
  ring: "accent when it reaches 3:1 on the canvas, else ink"
  neutrals: "warm when accent is the default, stone otherwise"

typography:
  fontFamily: "Satoshi, Inter, -apple-system, system-ui, Roboto, 'Helvetica Neue', sans-serif"
  stat-display:
    {
      fontSize: 32px,
      fontWeight: 600,
      lineHeight: 1.15,
      letterSpacing: -0.5px,
      fontVariantNumeric: tabular-nums,
    }
  display-xl: { fontSize: 28px, fontWeight: 700, lineHeight: 1.29, letterSpacing: 0 }
  display-lg: { fontSize: 22px, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.44px }
  price-lg:
    {
      fontSize: 22px,
      fontWeight: 600,
      lineHeight: 1.18,
      letterSpacing: 0,
      fontVariantNumeric: tabular-nums,
    }
  display-sm: { fontSize: 20px, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.18px }
  title-md: { fontSize: 16px, fontWeight: 600, lineHeight: 1.25, letterSpacing: 0 }
  title-sm: { fontSize: 16px, fontWeight: 500, lineHeight: 1.25, letterSpacing: 0 }
  body-md: { fontSize: 16px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  body-sm: { fontSize: 14px, fontWeight: 400, lineHeight: 1.43, letterSpacing: 0 }
  table:
    {
      fontSize: 14px,
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: 0,
      fontVariantNumeric: tabular-nums,
    }
  caption: { fontSize: 14px, fontWeight: 500, lineHeight: 1.29, letterSpacing: 0 }
  caption-sm: { fontSize: 13px, fontWeight: 400, lineHeight: 1.23, letterSpacing: 0 }
  column-head: { fontSize: 12px, fontWeight: 600, lineHeight: 1.33, letterSpacing: 0.2px }
  badge: { fontSize: 12px, fontWeight: 600, lineHeight: 1.33, letterSpacing: 0 }
  button-md: { fontSize: 16px, fontWeight: 500, lineHeight: 1.25, letterSpacing: 0 }
  button-sm: { fontSize: 14px, fontWeight: 500, lineHeight: 1.29, letterSpacing: 0 }
  link: { fontSize: 14px, fontWeight: 400, lineHeight: 1.43, letterSpacing: 0 }
  nav-link: { fontSize: 15px, fontWeight: 500, lineHeight: 1.33, letterSpacing: 0 }

rounded:
  none: 0px
  xs: 6px
  sm: 12px
  md: 18px
  lg: 24px
  xl: 32px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

breakpoints:
  sm: 640px
  md: 744px
  lg: 1128px
  xl: 1440px

components:
  button-primary:
    {
      backgroundColor: "{theme.accent} / {colors.primary}",
      textColor: "{theme.on-accent} / {colors.on-primary}",
      typography: "{typography.button-md}",
      rounded: "{rounded.sm}",
      height: 48px,
      padding: 14px 24px,
    }
  button-primary-active: { backgroundColor: "{theme.accent-active} / {colors.primary-active}" }
  button-disabled: { backgroundColor: "{colors.surface-strong}", textColor: "{colors.muted}" }
  button-secondary:
    {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      border: "1px {colors.border-strong}",
      rounded: "{rounded.sm}",
      height: 48px,
    }
  button-compact:
    { typography: "{typography.button-sm}", rounded: "{rounded.sm}", height: 36px, hitArea: 44px }
  button-tertiary-text: { textColor: "{colors.ink}", typography: "{typography.button-md}" }
  button-destructive:
    {
      backgroundColor: "{colors.error-text}",
      textColor: "{colors.on-error}",
      active: "{colors.error-active}",
    }
  icon-button:
    {
      backgroundColor: "{colors.surface-strong}",
      textColor: "{colors.ink}",
      rounded: "{rounded.sm}",
      height: 48px,
    }
  text-input:
    {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      border: "1px {colors.border-strong}",
      typography: "{typography.body-md}",
      rounded: "{rounded.sm}",
      height: 48px,
      placeholder: "{colors.muted}",
    }
  select:
    {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      rounded: "{rounded.sm}",
      height: 48px,
    }
  status-badge: { typography: "{typography.badge}", rounded: "{rounded.full}", padding: 3px 10px }
  toast:
    {
      backgroundColor: "{colors.toast}",
      textColor: "{colors.on-toast}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.sm}",
    }
  card:
    { backgroundColor: "{colors.canvas}", border: "1px {colors.hairline}", rounded: "{rounded.md}" }
  empty-state:
    { textColor: "{colors.muted}", typography: "{typography.body-md}", padding: 48px 24px }
  skeleton:
    {
      backgroundColor: "{colors.surface-strong}",
      rounded: "{rounded.xs}",
      delay: 300ms,
      shimmer: 1.6s,
    }
  shop-header: { backgroundColor: "{colors.canvas}", textColor: "{colors.ink}", height: 72px }
  shop-footer: { backgroundColor: "{colors.canvas}", typography: "{typography.body-sm}" }
  powered-by: { textColor: "{colors.muted}", typography: "{typography.caption-sm}" }
  admin-sidebar:
    { backgroundColor: "{colors.surface-soft}", typography: "{typography.nav-link}", width: 248px }
  admin-rail: { backgroundColor: "{colors.surface-soft}", width: 72px }
  admin-bottom-bar: { backgroundColor: "{colors.canvas}", height: 64px }
  admin-nav-item-active:
    {
      backgroundColor: "{colors.surface-strong}",
      indicator: "3px {colors.primary}",
      rounded: "{rounded.sm}",
    }
  admin-topbar: { backgroundColor: "{colors.canvas}", height: 64px }
---

# Rubi design system

This is the design source of truth for Rubi. Spec [0003](docs/specs/0003-design-system-ui-foundation/index.md) turns it into code. Token values live in `src/app/globals.css` (what the browser reads) and `src/lib/design/tokens.ts` (what the tests read). A Vitest test fails if the two drift, and another fails if any hex in the front matter above is missing from `tokens.ts`. When you change a value, change all three.

## Overview

Rubi helps small Nigerian sellers run a real shop without a real budget: a storefront that looks professional to their customers, and an Admin that keeps products and orders in one place. Most sellers already sell through WhatsApp, Instagram and TikTok. Rubi gives them a link that looks trustworthy and an order book that does not live in their chat history. Everything should feel warm, calm and competent. Never a template, never a spreadsheet.

The system has **two surfaces**, and knowing which one you are on decides most choices:

|                 | **Shop**                                                                      | **Admin**                                  |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Who sees it     | The seller's customers                                                        | The seller                                 |
| Whose brand     | The seller's: shop name and, from feature 13, their logo and **accent color** | Rubi's: wordmark and **Rubi Madder**       |
| Job             | Sell: show products well, make ordering feel safe                             | Organize: products, orders, payment status |
| Density         | Airy, photo first                                                             | Denser, list and number first              |
| Dark mode       | Never                                                                         | Follows the phone                          |
| Rubi visible as | A small **Powered by rubi** mark in the footer                                | Everywhere                                 |

A third look, **Rubi light**, covers the marketing page and the root not found and error pages: Madder on warm neutrals, always light.

The base canvas is **Snow** (`canvas`, #fcf7f8) with deep red black **ink** (#2a1a1d). In the Admin, **Rubi Madder** (#a31621) is the single strong color, on primary actions and the wordmark dot. In a Shop, that role goes to the seller's **accent**, which stays Madder until the seller picks their own (feature 13).

Type runs **Satoshi** at modest weights everywhere. Shops lean on product photos for visual weight; the Admin leans on numbers, so it is the one place type gets louder (`stat-display`).

The shape language is **soft**: 12px buttons and inputs, 18px cards, pills for badges. No hard corner on anything interactive.

**Key characteristics:**

- One accent per surface: the seller's accent in the Shop, Madder in the Admin. Never both on one screen, except the tiny Rubi mark in a Shop footer.
- Sellers choose **one color, one logo, one cover photo** and nothing else (feature 13). Type, spacing, radii and layout are fixed. That fixed floor is the product: any shop looks considered.
- Status has its own palette, so "Paid" and "Needs attention" never look like a button.
- Prices, totals and table numbers use tabular figures so columns line up.
- One shadow tier only (`shadow-float`), on menus, sheets and floated cards.
- 4px base spacing, 64px between major Shop sections, 24px between Admin cards.

## Brand

### Wordmark

The logo is a lowercase **rubi** wordmark in Satoshi Bold (700) with tight tracking (`-0.05em`), in ink. The "i" is drawn, not typed: a dotless `ı` stem with a round **Madder dot** (#a31621) about 0.28em wide placed over it. In code it is the `Wordmark` component (`src/components/brand/wordmark.tsx`); its text is hidden from screen readers and the element is labelled "Rubi".

- Minimum size: 20px cap height on screen. Below that, use the Madder dot alone (`DotMark`) as the avatar or icon mark.
- Clear space: one dot width on every side.
- Never recolor the stem, outline the wordmark, or place it on a photo without a Snow plate behind it.
- In dark mode the stem follows ink (light); the dot stays Madder.

**Where it appears:**

- **Admin:** top of the sidebar; the icon rail shows the dot alone. The Madder dot is the favicon and app icon.
- **Shop:** never in the header. Only as the **Powered by rubi** mark (13px, muted, Madder dot) in the shop footer, linking to Rubi's seller sign up. The seller's name (and later their logo) is the header.
- **Seller without a logo:** the shop name in Satoshi 700 at 20px, in ink. Favicon (feature 13): the shop's first letter in on accent on an accent circle.

### Naming

Use these terms in UI, docs and marketing.

| Rubi term    | Use for                                      | Never say                                   |
| ------------ | -------------------------------------------- | ------------------------------------------- |
| **Shop**     | A seller's storefront and everything in it   | Store site, page                            |
| **Admin**    | The seller's back office                     | Dashboard (as a product name), backend, CMS |
| **Seller**   | The person running a shop                    | Merchant, vendor (in UI)                    |
| **Customer** | Someone who orders from a shop               | Buyer, user, client                         |
| **Products** | What a shop sells                            | Items, listings, SKUs (in UI)               |
| **Variants** | Size, color and other options of one product | Options, SKUs                               |
| **Orders**   | A placed order, paid or not                  | Purchases, transactions                     |

### Voice and tone

Rubi speaks in two places. **To sellers** (Admin, onboarding, emails) it sounds like a capable friend who has run a shop before: warm, plain, practical. **To customers** (cart, order, confirmation, the system strings in a Shop) it steps back so the seller's voice leads, and it is as calm and clear as possible about money.

- **Warm, not cute.** "Your first order is in", not "Woohoo! Cha ching!".
- **Plain, not corporate.** "Mark it paid when the transfer lands", not "Update the settlement status".
- **Specific, not superlative.** "3 orders to confirm today", not "You're crushing it!".
- **Calm about money.** Show totals in full. Never use urgency tricks in a Shop ("Only 1 left!", countdown timers), even when a seller asks.
- **Sentence case everywhere; no exclamation marks in UI.**

Money is always written the way `formatNaira` prints it: `₦48,000.00`.

| Moment                  | Write                                                                                                      | Avoid                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- |
| New order (Admin)       | New order from Sam K., 2 items, ₦48,000.00. Message them on WhatsApp to confirm.                           | You've got a new sale!!!        |
| Empty products (Admin)  | No products yet. Add your first one: a photo, a name and a price is enough to start.                       | You have 0 products.            |
| Manual payment (Admin)  | Mark this order paid once the ₦48,000.00 transfer is in your account.                                      | Payment pending reconciliation. |
| Order placed (customer) | Thanks, Maya. Your order is in. Continue on WhatsApp so the shop can confirm it and share payment details. | Order placed successfully!      |
| Checkout (customer)     | No account needed. Add your name and phone number so the shop can reach you.                               | Sign up to continue.            |

## Colors

Code uses shadcn's variable names; this document uses design roles. The mapping:

| DESIGN.md role                  | CSS variable (Tailwind class)                                             |
| ------------------------------- | ------------------------------------------------------------------------- |
| canvas                          | `--background`, `--card`, `--popover` (`bg-background`, `bg-card`)        |
| ink                             | `--foreground` and the `*-foreground` set (`text-foreground`)             |
| body                            | `--body` (`text-body`)                                                    |
| muted (text)                    | `--muted-foreground` (`text-muted-foreground`)                            |
| muted soft (disabled text only) | `--muted-soft` (`text-muted-soft`)                                        |
| surface soft                    | `--muted`, `--accent` (hover wash), `--sidebar` (`bg-muted`, `bg-accent`) |
| surface strong                  | `--secondary` (`bg-secondary`, `bg-surface-strong`)                       |
| hairline                        | `--border` (`border-border`, the default border)                          |
| hairline soft                   | `--hairline-soft`                                                         |
| border strong                   | `--input` (`border-input`)                                                |
| focus                           | `--ring` (`outline-ring`)                                                 |
| primary / accent                | `--primary`                                                               |
| on primary                      | `--primary-foreground`                                                    |
| primary active (press)          | `--primary-active`                                                        |
| accent tint                     | `--primary-tint` (decorative fills only)                                  |
| primary mid                     | `--primary-mid` (charts only)                                             |
| error text, destructive fill    | `--destructive`                                                           |
| on destructive                  | `--destructive-foreground`                                                |
| destructive hover and press     | `--destructive-active`                                                    |
| toast                           | `--toast`, `--toast-foreground`                                           |
| active nav bar                  | `--nav-indicator`                                                         |
| scrim                           | `--scrim` (`bg-scrim`)                                                    |
| status tones                    | `--status-<tone>` fill, `--status-<tone>-foreground` text                 |
| legal link                      | `--legal-link`                                                            |
| charts                          | `--chart-1` to `--chart-5`                                                |

Never write a hex value or a Tailwind palette class (`bg-white`, `text-gray-500`) in a component. An ESLint rule rejects both in `className` and `cn()`.

### Platform brand (Admin)

- **Rubi Madder** (#a31621): the platform's one brand color. Snow labels at 7.4:1. Primary actions ("Save product", "Mark as paid"), the wordmark dot, the active nav bar.
- **Madder active** (#7e1019): press state.
- **Madder tint** (#edb8bd) and **Madder mid** (#d4646d): charts and illustration only. Never text, never a button.
- Disabled buttons use surface strong with muted text rather than a pale Madder, so a disabled button never looks like a faded brand moment.

### Seller theme (Shop, feature 13)

A seller sets **one color**: the accent. The system derives the rest and refuses combinations that would hurt the shop. Until feature 13 every shop uses the default theme (Madder on warm neutrals). In code, a shop's theme is a `ShopTheme` (`src/features/stores/shop-theme.ts`) passed to `ShopShell`; only `#rrggbb` values ever reach CSS.

**Where the accent goes:** primary buttons (Place order, Continue on WhatsApp), inline links in seller copy, the selected variant chip ring, the sale badge, focus rings, the cart count dot.

**Where it never goes:** prices (ink), status and error messages (status palette), body text, large background fills, the Powered by rubi mark.

**Derivation and guardrails** (feature 13):

1. **On accent label:** Snow or ink, whichever contrasts more. It must reach **4.5:1**.
2. **Too light or too vivid?** If neither label reaches 4.5:1, lower the accent's OKLCH lightness until Snow passes, and tell the seller: "We darkened your color slightly so buttons stay readable."
3. **Accent active:** accent at OKLCH lightness minus 0.08, for press states.
4. **Accent tint:** 18% accent over the canvas, for selected chip fills. Decorative only, never carries text.
5. **Focus ring:** the accent when it reaches 3:1 on the canvas, else ink.
6. **Neutrals:** the default Madder keeps the warm neutrals. **Any other accent switches the shop to stone neutrals**, because the blush tinted greys clash with blues, greens and yellows.
7. **Too close to a status color?** Keep it; status badges carry an icon so meaning never relies on hue alone.

### Neutrals, warm (Admin, Rubi pages, default shops)

- **Snow** (`canvas`, #fcf7f8): page floor and card fill. Never swap for pure white.
- **Surface soft** (#f6eef0): Admin sidebar, hover wash, quiet panels.
- **Surface strong** (#f1e5e8): active nav item, disabled buttons, skeletons, image placeholders.
- **Hairline** (#eadcdf): default 1px borders, dividers, card borders.
- **Hairline soft** (#f2e8ea): chart gridlines, long list separators.
- **Border strong** (#987d83): input, select, stepper and uploader outlines. 3.5:1 on the canvas, at least 3:1 on every surface. (The original #d3c1c5 was 1.62:1, below the WCAG 3:1 for component boundaries.)
- **Ink** (#2a1a1d, 15.7:1): headlines, prices, table cells.
- **Body** (#4a3539): long product descriptions.
- **Muted** (#6e5a5e, 6.0:1): sub labels, column heads, helper text, timestamps, and **placeholders**.
- **Muted soft** (#9a888c, 3.2:1): **disabled text only**. Never placeholders, never meaningful copy.

### Neutrals, stone (shops with a custom accent)

The same roles on a true neutral ramp: **Canvas** #fafaf9, **Surface soft** #f5f5f4, **Surface strong** #efedeb, **Hairline** #e7e5e4, **Hairline soft** #f0eeec (derived), **Border strong** #8a8580 (was #d6d3d1, 1.43:1), **Ink** #1c1917, **Body** #44403c, **Muted** #57534e, **Muted soft** #a8a29e (disabled only). The stone block sets `data-neutrals="stone"` on the shop shell; components reference the role, and the theme picks the ramp. The float shadow's last layer becomes `rgba(28, 25, 23, 0.08)`.

### Status

Four tones, for order, payment and stock states. Each pairs a dark text color with a soft fill, and every badge carries an icon as well as a label. In code: `StatusBadge` (`src/components/status-badge.tsx`). Mapping an order or payment state to a tone belongs to the feature that owns that state.

| Tone          | Text / fill       | Icon           | Use for                               |
| ------------- | ----------------- | -------------- | ------------------------------------- |
| **Success**   | #166534 / #e7f3ea | check          | Paid, Delivered, In stock             |
| **Info**      | #1d4ed8 / #e8eefc | clock          | New, Confirmed, Awaiting payment      |
| **Attention** | #92400e / #fbecdf | alert triangle | Needs action, Low stock, Out of stock |
| **Neutral**   | #6e5a5e / #f1e5e8 | minus          | Draft, Archived, Cancelled            |

There is deliberately **no red** status. Madder is red, a seller's accent may be red, and a red "Failed" next to a red button reads as one more thing to click. Problems use amber brown, which is distinct from every brand moment.

- **Error text** (#b45309, 4.7:1): inline form validation, always with an icon. It is also the **destructive fill** for solid destructive buttons, with a Snow label; hover and press use #92400e.
- **Legal link blue** (#2563eb): links inside legal copy only.
- **Scrim**: black at 50% (60% in dark) behind sheets and dialogs (`bg-scrim`).

### Data visualization (Admin, **Later**)

- **Single series:** Madder.
- **Comparison:** this period in Madder, last period in blue #4f86c6.
- **Sequential:** surface strong, Madder tint, Madder mid, Madder active.
- Charts never use status colors for series, and never use the seller's accent.

### Dark mode (Admin)

The Admin follows the phone's dark setting; shops and Rubi pages stay light. Dark keeps the warm cast instead of falling to grey. Every role has a dark value (front matter `dark:`):

- **Canvas** #1f1719, **Surface soft** #2a2023, **Surface strong** #352a2d, **Hairline** #3d3034, **Hairline soft** #33282b, **Border strong** #8a767a.
- **Ink** #f6eef0, **Body** #ddd0d3, **Muted** #b8a7ab, **Muted soft** #7d6a6e (disabled only).
- **Madder** lifts to #c4303b (Snow label 5.2:1). Its **press state darkens** to #a8232d. (The original lightened to #d9505a, where Snow labels fell to 3.77:1.)
- **Active nav bar** #d9505a: 3:1 or better on the dark sidebar and active fill, where #c4303b is only 2.88:1.
- **Error and destructive** #f0a868 with a canvas colored label; hover and press #f5bd8a.
- **Toast** flips: Snow fill, ink text (15.66:1).
- **Status text** lifts to #4ade80, #93b4f5, #f0a868, #b8a7ab on fills of 16% of the same color over the canvas.
- Focus outline is light ink (#f6eef0).

### Contrast

Every text pair reaches 4.5:1 and every boundary (input outlines, focus ring, active nav bar) 3:1 in warm, stone and dark. `src/lib/design/contrast.test.ts` holds the list; a token change that breaks one fails the test. Exempt: muted soft (disabled text only), Madder tint, Madder mid and chart colors.

## Typography

### Font family

**Satoshi** for everything, on both surfaces, self hosted from one variable `woff2` (weights 300 to 900) through `next/font/local`, with a size adjusted Arial fallback. No page requests a third party font host. Fallbacks walk `Inter, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif`.

**Satoshi has no naira sign (U+20A6).** The browser draws `₦` from the fallback font inside a Satoshi price. It is legible and close in weight; do not fake it with a struck N. Satoshi does have the dotless `ı` the wordmark needs.

The font licence (ITF Free Font License, `src/app/fonts/Satoshi-LICENSE.txt`) allows self hosting on Rubi's own site but not redistribution, so the repository must stay private while it holds the font file.

Sellers cannot change the typeface. One trusted family is part of what makes every shop look finished.

### Hierarchy

Each token is a Tailwind class (`text-display-xl`) that sets size, line height, weight and tracking together.

| Token          | Size | Weight | Line height | Use                                                        |
| -------------- | ---- | ------ | ----------- | ---------------------------------------------------------- |
| `stat-display` | 32px | 600    | 1.15        | Admin stat tiles ("₦241,860.00"), tabular                  |
| `display-xl`   | 28px | 700    | 1.29        | Shop hero headline, Admin page titles ("Orders")           |
| `display-lg`   | 22px | 500    | 1.18        | Product page product name                                  |
| `price-lg`     | 22px | 600    | 1.18        | Product page price, order total, tabular                   |
| `display-sm`   | 20px | 600    | 1.20        | Section heads, shop name in the shop header                |
| `title-md`     | 16px | 600    | 1.25        | Card titles, product card names, form section titles       |
| `title-sm`     | 16px | 500    | 1.25        | Footer column heads, sheet titles                          |
| `body-md`      | 16px | 400    | 1.5         | Descriptions, form inputs, running text (the body default) |
| `body-sm`      | 14px | 400    | 1.43        | Card meta, helper text, cart lines                         |
| `table`        | 14px | 400    | 1.43        | Table cells, tabular                                       |
| `caption`      | 14px | 500    | 1.29        | Input labels, filter labels                                |
| `caption-sm`   | 13px | 400    | 1.23        | Timestamps, legal line, "Powered by rubi"                  |
| `column-head`  | 12px | 600    | 1.33        | Table column heads, in muted                               |
| `badge`        | 12px | 600    | 1.33        | Status and sale badges                                     |
| `button-md`    | 16px | 500    | 1.25        | Buttons                                                    |
| `button-sm`    | 14px | 500    | 1.29        | Compact buttons, chips                                     |
| `link`         | 14px | 400    | 1.43        | Inline links                                               |
| `nav-link`     | 15px | 500    | 1.33        | Shop header nav, Admin nav items                           |

### Principles

- **Shop type stays quiet.** The hero headline is only 28px; the products and photos carry the page.
- **Admin numbers are the loud moment.** `stat-display` is the largest type in the system.
- **Every number that sits in a column or might change uses tabular figures** (`tabular-nums`).
- **Prices are always ink, never the accent.** A price is information, not an action.
- Product descriptions cap at about 68 characters per line.

## Layout

### Spacing

- **Base unit:** 4px, with a 2px micro step. Tailwind's default scale already matches, so use its numbers: `xxs` 0.5, `xs` 1, `sm` 2, `md` 3, `base` 4, `lg` 6, `xl` 8, `xxl` 12, `section` 16 (`gap-6` is 24px). There are no named spacing classes, because names like `md` would collide with Tailwind's sizes.
- **Shop:** 64px between major sections; 24px between product cards; 16px between a card's photo and its meta.
- **Admin:** 24px between cards and between a page title and its content; 20 to 24px inside cards.

### Breakpoints

| Name    | Min width | Tailwind                                    |
| ------- | --------- | ------------------------------------------- |
| Mobile  | 0         | (none)                                      |
| Small   | 640px     | `sm:` (kept for shadcn's generated classes) |
| Tablet  | 744px     | `md:`                                       |
| Desktop | 1128px    | `lg:`                                       |
| Wide    | 1440px    | `xl:`                                       |

There is no `2xl:`.

### Containers

**Shop** (`max-w-shop`, 1280px): centered, 16px side gutters below 744px, 32px from 744px.

- **Shop home:** hero (cover photo, shop name, one action), products, about the seller, footer.
- **Product grid:** 4 columns desktop, 3 tablet, 2 mobile. Never one product per row on mobile.
- **Product page:** gallery left (about 58%), buy box right (about 42%, sticky on desktop).
- **Order form:** a single focused column (max 560px). Guest checkout: name and phone, no account.

**Admin** (`max-w-admin`, 1200px): the shell holds the nav and topbar; pages hold content.

- **Shell:** 248px sidebar from 1128px, a 72px icon rail from 744px to 1127px, a 64px bottom tab bar below 744px (plus the phone's safe area). Topbar 64px.
- **Home:** stat tiles, then "Needs your attention", then recent orders.
- **List pages** (Orders, Products): page title and primary action, filter chips, the list.
- **Edit pages:** a main column of form section cards; save in a sticky bar.

### Whitespace

Shops breathe: generous section spacing makes a shop with twelve products feel curated, not empty. The Admin is denser but never cramped.

## Elevation

One shadow tier plus flat:

- **Flat:** almost everything. Pages, cards at rest (a 1px hairline instead), lists, the sidebar.
- **Float** (`shadow-float`): `rgba(42, 26, 29, 0.05) 0 0 0 1px, rgba(42, 26, 29, 0.05) 0 2px 6px 0, rgba(126, 16, 25, 0.10) 0 8px 20px -4px`. Menus, sheets, product cards on hover.
- **Scrim:** behind sheets and dialogs.

## Components

Primitives live in `src/components/ui` (shadcn, Radix base, maia style), restyled to this document. Use them; do not hand roll inputs or buttons.

### Shared

**Button**: `default` is the primary (accent or Madder fill, on color label, 48px, 12px radius). One per view: "Save product", "Place order", "Mark as paid". Hover equals rest; **press** darkens to primary active. No transform, no shadow change.

**Secondary** (`variant="outline"`): canvas fill, ink label, 1px border strong outline. "Cancel", "View shop".

**Tertiary** (`variant="ghost"`): ink text on no surface, surface soft wash on hover. "View all", "Edit".

**Destructive** (`variant="destructive"`): solid error fill with an on error label; hover and press use the destructive active color. Confirm destructive actions.

**Compact** (`size="sm"`): 36px tall, for toolbars and card headers in the Admin. It keeps a 44px hit area.

**Icon button** (`size="icon"`): 48px square (36px compact), always with an `aria-label`.

**Disabled**: surface strong fill, muted label, not allowed cursor. Explain why nearby ("Add a price to publish").

**Pending**: compose `Spinner` with `disabled` and keep the label.

**Field, Input, Textarea, NativeSelect, InputGroup**: 48px tall, canvas fill, 1px border strong outline, 12px radius. Label above in `caption`, helper text below in `body-sm` muted. Placeholders in muted. Money inputs use an `InputGroup` with a fixed `₦` prefix and `inputMode="decimal"`.

**Focus** (every control): a solid 2px outline in `--ring` with a 2px offset. Ink in the Admin and Rubi pages, the shop's ring color in a shop.

**Error**: a 2px error outline, an icon and a message below. On focus the error outline takes the ring's place and keeps the offset.

**StatusBadge**: pill, `badge` type, status fill and text, 14px leading icon. For orders, separate **payment** and **fulfillment** badges ("Paid" and "Unfulfilled").

**Toast** (sonner): toast fill, toast text, bottom center, auto dismiss after 5 seconds, optional single text action ("Undo"). Admin only. Never for errors that need action.

**Empty**: centered block: icon in muted, a one line title in `title-md`, one sentence of help, one primary action.

**Skeleton**: surface strong blocks matching the final layout. Invisible for the first 300ms (fast loads never flash), then a slow 1.6s shimmer. No shimmer when the phone asks for reduced motion.

**Card**: canvas fill, 1px hairline border, 18px radius, flat.

**Alert, Separator, DropdownMenu, Sheet**: menus and sheets float (`shadow-float`) over `bg-scrim`.

### Touch targets

- Buttons and inputs 48px tall; compact controls 36px.
- **Every control smaller than 44px gets a 44px hit area** through an inset `after:` pseudo element on a `relative` control.
- Adjacent compact controls keep at least an 8px gap so hit areas never overlap.

### Shop

**Shop shell** (`ShopShell`): a 72px header with the shop name (Satoshi 700, 20px) linking to the shop home, and a footer with the Powered by rubi mark. Server components only; no client JavaScript.

**Product card** (feature 7): photo first, 4:5 image with 18px clipping on surface strong (missing or slow images still hold shape). Name in `title-md` (2 lines max), price in `body-sm` 600 ink.

**Variant chip** (feature 12): pill per option. Selected: 2px accent ring and accent tint fill. Unavailable: muted label with a strike, still focusable, announced as sold out.

**Quantity stepper** (feature 9): 44px pill, minus, tabular count, plus.

**Cart sheet and WhatsApp handoff** (feature 9): line items, subtotal, then one primary action that hands the order to WhatsApp with a prefilled message.

**Shop footer**: seller about line, contact links, and Powered by rubi.

**Later:** card checkout and its secure checkout row, reviews and star ratings, the Rubi Promise.

### Admin

**Admin shell** (`AdminShell`): sidebar (surface soft, `Wordmark` at top), icon rail (dot mark), or bottom tab bar depending on width. Nav comes from one typed list (`ADMIN_NAV`) with only routes that exist. The active item has surface strong fill, a 3px nav indicator bar at its left edge, and `aria-current="page"`. The bottom bar adds a **More** sheet. The topbar shows the shop name, **View shop** (only when published) and the account menu with **Sign out**. The shell owns the one `<main id="main">` and a skip link.

**Stat tile** (feature 15): canvas card with hairline border, muted label, value in `stat-display`, change line in `body-sm`.

**Order list** (feature 8): rows with hairline dividers, status badges in their own column; below 744px rows become stacked cards.

**Filter chip** (feature 8): pill with hairline outline; selected chips fill with surface strong and show a count ("Unpaid · 4").

**Form section card** (feature 6): canvas card with hairline border and a `title-md` title, one topic each.

**Image uploader** (feature 6): surface soft drop zone with a dashed border strong edge, 18px corners.

**Theme picker** (feature 13): a color input with suggested swatches, logo and cover uploaders, beside a live preview.

**Later:** payouts and the payout card, data table bulk actions and the bulk action bar, analytics charts beyond the stat tiles.

## Do and don't

- Do use a token class for every color. Don't write a hex value or a palette class.
- Do keep one primary button per view. Don't put two filled buttons side by side.
- Do write prices in ink with `tabular-nums`. Don't color a price with the accent.
- Do use `StatusBadge` for state. Don't use primary or the accent for status.
- Do give every input a visible label. Don't rely on a placeholder as the label.
- Do keep the Shop light. Don't add `dark:` styles to shop components.

## Known gaps

- **Seller theming beyond color:** custom fonts, button shape or dark shops are not offered.
- **Transactional emails:** need their own template spec.
- **Hover tokens:** hover fills (surface soft on rows, accent tint on chips) are described per component, not tokenized.
- **Payments, payouts, analytics, reviews:** outside the MVP (manual payment status only).
