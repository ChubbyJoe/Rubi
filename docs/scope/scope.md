# Scope: Rubi

Rubi is a connected business platform for small Nigerian sellers who run their business through WhatsApp, Instagram, TikTok and referrals. It gives them a professional storefront, keeps their catalog, orders, customers and payments in one place, and over time turns that activity into insight. It complements their existing channels rather than replacing them.

**Build approach:** Tracer Bullet (prove one real thread through every layer first, then thicken one segment at a time, each slice shipped end to end).
**Workflow:** Beta (after `/develop`, run `/check verify`, then `/test`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

**MVP boundary:** storefront plus orders. Sellers sign up, build a catalog, share a store link, receive orders, and track order and manual payment status. Market: Nigeria, naira only, English only. Customers check out as guests. Success metric: active sellers receiving real orders every week.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | planned |
| 3 | Data model | Foundation | planned |
| 4 | Design system & UI foundation | Foundation | planned |
| 5 | Seller sign up & store setup | Slice 1 | planned |
| 6 | Add a product | Slice 1 | planned |
| 7 | Public storefront & order placement | Slice 1 | planned |
| 8 | Orders inbox | Slice 1 | planned |
| 9 | Cart & WhatsApp handoff | Slice 2 | planned |
| 10 | Order status & manual payments | Slice 3 | planned |
| 11 | New order notifications | Slice 4 | planned |
| 12 | Catalog depth | Slice 5 | planned |
| 13 | Store branding & link previews | Slice 6 | planned |
| 14 | Customer records | Slice 7 | planned |
| 15 | Needs attention home | Slice 8 | planned |
| 16 | Error monitoring & key events | Launch | planned |
| 17 | Legal pages & data protection | Launch | planned |

## Foundations

### 1. Stack & architecture · done
Decide the stack and scaffold a runnable project so every later slice builds on real structure. Storefronts must render fast on mid range phones and slow mobile data, and be readable by link preview crawlers.
**Done when:** the stack is recorded in a spec and the empty scaffold boots locally, builds, and deploys.
spec [0001](../specs/0001-stack-architecture/index.md) · code in `src/`, `scripts/`, `drizzle/`
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`

### 2. Coding standards & tooling
Capture conventions, then install lint, format, and pre-commit enforcement from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint, format and pre-commit run clean.
- [ ] Capture conventions + tooling choices: `/audit`

### 3. Data model · needs a decision
Core entities every feature builds on: sellers, stores, products, orders, order items, customers, payments. Shaped so expenses, online payments and insights can be added later without a breaking migration.
**Done when:** entities and relationships support all planned slices, money is stored safely in naira, and each seller's data is isolated from every other seller's.
- [ ] Design it (spec): `/architect data model`

### 4. Design system & UI foundation · needs a decision
Visual language, layout primitives and base components, mobile first, so the seller dashboard and storefronts feel cohesive, credible and accessible.
**Done when:** `design.md` covers type, color, spacing and components; base components meet contrast, labeling and keyboard basics and stay light on low data connections.
- [ ] Design it (spec): `/architect design system & UI foundation`

## Slice 1: Core sell loop

The thinnest real thread: a seller signs up, adds one product, shares the link, a customer orders it, and the order shows up for the seller. Real accounts, real data, real UI, just narrow. This slice is the walking skeleton.

### 5. Seller sign up & store setup · needs a decision · GA
A seller creates an account with phone or email, names their store, and gets a unique store link.
**Done when:** a seller can sign up, sign in, sign out and recover access; the store has a unique, shareable address; one seller can never see another seller's data.
- [ ] Design it (spec): `/architect seller sign up & store setup`

### 6. Add a product · needs a decision
A seller adds a product with a name, price, description and one photo, from their phone.
**Done when:** a seller can create, edit and remove a product with one photo; photos are compressed for slow connections; empty and error states render.
- [ ] Design it (spec): `/architect add a product`

### 7. Public storefront & order placement · needs a decision
The public store page lists the seller's products; a customer picks one product, enters name, phone and delivery details as a guest, and places an order.
**Done when:** anyone with the link can browse the store and order one product without an account; the order is saved for the seller; the page loads fast on a mobile connection.
- [ ] Design it (spec): `/architect public storefront & order placement`

### 8. Orders inbox
The seller sees incoming orders in one list and can open each to see the items and customer details.
**Done when:** a new order placed on the storefront appears in the seller's inbox with its items, total and customer contact; empty state renders.
- [ ] Build it: `/develop orders inbox`

## Slice 2: Cart & WhatsApp handoff

### 9. Cart & WhatsApp handoff · needs a decision
Customers add several products and quantities to a cart, submit one order, and get a one tap button to continue the conversation with the seller on WhatsApp with the order prefilled.
**Done when:** a customer can build a cart, change quantities, submit it as one order, and open WhatsApp with a prefilled order summary; the cart survives a page refresh.
- [ ] Design it (spec): `/architect cart & WhatsApp handoff`

## Slice 3: Order status & manual payments

### 10. Order status & manual payments · needs a decision
Orders move through clear stages (new, confirmed, paid, delivered, cancelled). Customers see the seller's bank details to pay by transfer; the seller marks the order paid when the alert lands.
**Done when:** a seller can move an order through its stages and record a manual payment with amount and date; the customer sees transfer details after ordering; the inbox filters by status.
- [ ] Design it (spec): `/architect order status & manual payments`

## Slice 4: New order notifications

### 11. New order notifications · needs a decision
Alert the seller the moment a new order arrives, so orders never sit unseen.
**Done when:** a seller is notified of each new order within a minute on their chosen channel, and can turn notifications on or off.
- [ ] Design it (spec): `/architect new order notifications`

## Slice 5: Catalog depth

### 12. Catalog depth · needs a decision
Categories, multiple photos, variants (size, color) and stock counts, so real catalogs fit.
**Done when:** a seller can group products into categories, add several photos, define variants with their own price and stock, and sold out items show as unavailable on the storefront.
- [ ] Design it (spec): `/architect catalog depth`

## Slice 6: Store branding & link previews

### 13. Store branding & link previews
Logo, banner, store description and contact links, plus rich previews when the store or a product link is shared on WhatsApp and Instagram, and basic search engine metadata.
**Done when:** a seller can brand their store; shared store and product links show title, image and price previews; pages carry titles, descriptions and a sitemap.
- [ ] Build it: `/develop store branding & link previews`

## Slice 7: Customer records

### 14. Customer records
A customer list built from orders: who bought, how often, how much, and how to reach them.
**Done when:** each order links to a customer record matched by phone number; the seller can view a customer's order history and total spend.
- [ ] Build it: `/develop customer records`

## Slice 8: Needs attention home

### 15. Needs attention home
The seller's home screen shows what needs action today: new orders, unpaid orders, orders to deliver, and low stock.
**Done when:** the home screen shows live counts and shortcuts for each attention item, plus today's and this week's sales total.
- [ ] Build it: `/develop needs attention home`

## Launch readiness

### 16. Error monitoring & key events · needs a decision
Error monitoring across the app, plus the few product events that measure the success metric (store published, product added, order received, order paid).
**Done when:** errors are captured with enough context to debug; the key events are recorded and you can see weekly active sellers receiving orders.
- [ ] Design it (spec): `/architect error monitoring & key events`

### 17. Legal pages & data protection · needs a decision · GA
Terms and privacy pages, and data handling aligned with Nigeria's data protection rules for seller and customer personal data.
**Done when:** terms and privacy pages are live and accepted at sign up; customer data collection is disclosed on the storefront; a seller can export or delete their data.
- [ ] Design it (spec): `/architect legal pages & data protection`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Expense tracking**: record business expenses by category · needs a decision
- **Sales & profit insights**: revenue, expenses and profit over time · needs a decision
- **Customer insights**: repeat buyers, top customers, buying patterns · needs a decision
- **Online checkout**: card and transfer payments at checkout, with payouts to sellers · needs a decision · GA
- **Subscription plans & billing**: free and paid tiers (custom domain, larger catalogs, insights) · needs a decision · GA
- **Custom domains**: a seller's own domain for their store · needs a decision
- **Shareable receipts & invoices**: send a professional receipt per order · needs a decision
- **Staff accounts**: let a helper manage orders with limited access · needs a decision
- **Local languages**: Pidgin, Yoruba, Hausa, Igbo · needs a decision
- **Delivery tracking**: delivery partner and tracking details per order · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop's own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
