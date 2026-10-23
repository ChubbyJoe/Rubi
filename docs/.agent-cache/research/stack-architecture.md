# Rubi stack research (as of 2026-10-23)

Scope: web framework, hosting, Postgres, auth + SMS OTP, ORM, image storage.
Budget constraint: near zero, free tiers first. Users in Nigeria.

Legend: [F] = page actually fetched in this research. [S] = search snippet only (not fetched). [U] = unverified (from memory or not checked).

Budget used: 5 web searches, 8 page fetches (all 8 fetches were spent; several official pages were not reachable, see gaps).

---

## 1. Full-stack TS framework (SSR storefront + PWA dashboard)

**Next.js** (current major: 16)
- Latest minor seen on the official blog: **Next.js 16.4** (2026-10-06) [F: https://nextjs.org/blog]. Adds lazy compilation, smaller Turbopack output, React 19.3 features, Cache Components improvements.
- Next.js 16.3 (2026-08-03), 16.2 (2026-03-18, introduces stable Adapter API) [F].
- Next.js 16 went stable 2025-10-21; Next 15.x is on maintenance LTS [F].
- Security: out-of-band security update 2026-10-14 for upstream vulnerabilities; monthly-ish security release program formalised 2026-07-13. Expect frequent patch bumps; pin and keep updating [F].
- Fit: most ecosystem support for SSR + OG meta tags; Vercel-optimised but runs elsewhere via Adapter API.
- Caveat: "latest" on npm was not verified directly. Confirm with `npm view next version` before scaffolding.

**React Router v7 (framework mode, ex-Remix)** [U]: viable SSR alternative, lighter than Next. Not researched in this pass.

**SvelteKit / Astro / TanStack Start** [U]: not researched in this pass. Astro is strong for mostly-static storefronts; not checked for the dashboard use case.

---

## 2. Hosting / edge near West Africa

**Cloudflare (Workers / Pages / R2)**
- Cloudflare's network page lists **Lagos, Nigeria** among 33 African cities (348 cities total, 8 regions) [F: https://www.cloudflare.com/network/]. This is the network footprint (PoP), which is what matters for latency.
- Search snippets describe the Lagos site as being in Lekki (MDXI) and peering with the local IXPN [S: https://ppc.land/cloudflare-opens-a-new-data-center-in-lagos/ and https://tech.africa/cloudflare-lagos-nigeria]. Opening date is conflicting across sources and not confirmed [S].
- Workers runs on the same network, so SSR at the edge is near Lagos users. Confirm Workers-specific behaviour (e.g. Next on Workers via OpenNext) before committing.
- Free tier Workers limits: [U] not fetched in this pass; check developers.cloudflare.com/workers/platform/limits.

**Vercel** [U]: free Hobby tier and Next.js-native. Not checked for Africa edge/region presence in this pass. Verify with vercel.com/docs regions and the Vercel MCP if needed.

**Netlify, Render, Fly.io** [U]: not researched in this pass.

Note: a PoP in Lagos means edge-cached HTML and static assets are close. The database region is the bigger latency factor for SSR (see section 3).

---

## 3. Managed Postgres (free tiers)

**Neon**
- Free plan [F: https://neon.com/pricing]: $0; 100 projects; 10 branches per project; 100 CU-hours per project; autoscaling up to 2 CU (8 GB RAM); scale-to-zero after 5 min (cannot be disabled); **1 GB storage per project, 20 GB total**; 5 GB public egress per project; 5 GB object storage per project; **auth up to 60k MAU per project**; monitoring retention 1 day; community support.
- Paid (pay-as-you-go): Launch $0.106/CU-hour, storage $0.35/GB-month. Scale $0.222/CU-hour [F].
- Regions: **not listed on the pricing page** [F]. Region availability for Nigeria proximity is unverified [U]. (Neon has aws-eu-central-1 / similar; check Neon's region list before choosing.)
- Note a secondary source says Neon doubled free storage in Oct 2026; the fetched official page already shows 1 GB, which is consistent with that [S/F].
- Changed recently: pricing moved to CU-hour plus branch and storage model; Neon is now part of Databricks [U, from memory; not verified in this pass].

**Supabase**
- Free plan [F: https://supabase.com/pricing]: 500 MB database per project; 1 GB file storage; 50k MAU; **max 2 active projects**; **free projects paused after 1 week of inactivity** (unpausable manually).
- Pro: from $25/month [F].
- Regions: **not listed on the pricing page** [F]. Supabase has an af-south-1 (Cape Town) region [U], which is the closest African option to Nigeria if confirmed.
- Note: Supabase free projects auto-pause; that is a real risk for a live storefront.

**Others** [U]: Render Postgres, Aiven, Xata, Prisma Postgres. Not researched in this pass.

---

## 4. Auth (phone OTP + email) and SMS providers

**Better Auth** (TypeScript-first, self-hosted in your own app/DB)
- Phone-number plugin [F: https://www.better-auth.com/docs/plugins/phone-number]: you supply a `sendOTP` callback (implement SMS delivery there); codes **6 digits** by default, **expire after 300 s** by default; send endpoint `POST /phone-number/send-otp`, verify endpoint `POST /phone-number/verify`; **3 failed attempts** by default then the code is invalidated (`allowedAttempts`). Docs advise not awaiting the sendOTP callback (timing attack).
- Fit: runs on your own Postgres, so no per-MAU auth vendor cost. Good fit for tenant-aware sessions.
- Version: not verified in this pass [U].

**Supabase Auth** / **Neon Auth** [U]: both bundle auth with the DB. Neon Auth free tier covers up to 60k MAU per project [F from Neon pricing page]. Not checked further.

**Clerk** [U]: strong UI, phone OTP supported, but has a per-MAU free tier that is smaller than the above and an extra vendor. Not checked in this pass.

**Auth.js** [U]: still around but its maintainers have shifted toward Better Auth; check before picking.

**SMS OTP providers for Nigeria**
- Termii: official pricing page not fetched [S]. Competitor blog lists a "from $25/month" entry tier [S]. Per-message rate not found [U].
- Africa's Talking: official SMS pricing page returned HTTP 403 and was not fetched [U]. Nigeria rate not verified.
- Twilio: [U] not checked; generally pricier for NG routes.
- Market estimate (vendor blog, not official) for Nigeria OTP: roughly $0.0055-$0.008 per message on local routes, $0.007-$0.015 on international routes, with more variability on international routes [S: https://www.messagecentral.com/blog/otp-sms-pricing-nigeria]. Treat as rough.
- Recommendation for next step: request a rate card from Termii and Africa's Talking directly; check sender ID registration rules for Nigeria (NCC requirement) [U].

---

## 5. ORM and image storage

**Drizzle ORM**
- Search snippet (Oct 2026 table): latest stable **0.45.4**; 1.0 still pre-release (1.0.0-rc.4 per that table) [S: https://tech-insider.org/drizzle-vs-prisma-2026/ and https://makerkit.dev/blog/md/tutorials/drizzle-vs-prisma]. A different Sept 2026 guide says 1.0 is beta and 0.45.2 is stable [S]. Sources conflict.
- Official release page fetch returned an old cached copy (v0.32.2 / 1.0 beta.2 Feb 2025) [F but stale; do not trust for current version]. Verify with `npm view drizzle-orm version`.
- Fit: SQL-close, small runtime, works well on edge runtimes; good for tenant-scoped query helpers and Postgres RLS.

**Prisma**
- Prisma 7.0.0 released 2025-11-19; replaced the Rust query engine with a TypeScript client (bundle reduction) [S].
- Search snippet (2026-10-19): npm `latest` dist-tag points to **8.0.0-rc.23**; **7.10.1** is the last fully stable 7.x [S]. Prisma 8 needs Node 22.18+ or 24.11+ and TS 5.9+ [S].
- Verify on prisma.io release notes [not fetched].
- Fit: heavier, but mature tooling and migrations. Edge support depends on driver adapters.

**Image storage / transforms**
- **Cloudflare R2** [F: https://developers.cloudflare.com/r2/pricing/]: free tier 10 GB-month storage, 1M Class A ops, 10M Class B ops per month; **egress free with no cap listed**; storage beyond free $0.015/GB-month. R2 is the best fit for zero-egress image serving to Nigerian users via Cloudflare's Lagos PoP.
- **Cloudflare Images** (resize/transform) [U]: not fetched; check current free tier (historically 5k unique transforms/month) before depending on it.
- **Supabase Storage** [F as Supabase pricing page]: 1 GB free file storage on the free plan. Too small for image-heavy storefronts on the free tier.
- **Vercel Blob** [U]: not checked this pass.
- **Cloudinary free tier** [U]: not checked this pass; historically generous transforms but limited storage and bandwidth.
- Compression/resizing: can be done at upload time with `sharp` in a Worker-friendly way or by R2 + Cloudflare transforms [U]. Not verified.

---

## Gaps and freshness notes

- Not fetched (blocked or budget): Termii pricing, Africa's Talking pricing (403), Vercel regions, Workers limits, Neon regions, Supabase regions, Prisma release notes, Better Auth version.
- Conflicting: Neon free storage (0.5 GB vs 1 GB; official page says 1 GB, so use 1 GB); Drizzle stable version (0.45.x vs 0.32.x in fetched page); Cloudflare Lagos opening date.
- Changed recently: Next.js 16.x line with Adapter API (16.2); Prisma 7 TS client (2025-11) and Prisma 8 RC (2026-10); Neon CU-hour pricing; Supabase free projects pause after 1 week.

## URLs

Fetched and verified (F):
- https://nextjs.org/blog
- https://neon.com/pricing
- https://supabase.com/pricing
- https://www.cloudflare.com/network/
- https://developers.cloudflare.com/r2/pricing/
- https://orm.drizzle.team/docs/latest-releases (stale cached copy, see above)
- https://www.better-auth.com/docs/plugins/phone-number

Search results only (S):
- https://costbench.com/software/database-as-service/neon/free-plan
- https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
- https://ppc.land/cloudflare-opens-a-new-data-center-in-lagos/
- https://tech.africa/cloudflare-lagos-nigeria
- https://makerkit.dev/blog/md/tutorials/drizzle-vs-prisma
- https://tech-insider.org/drizzle-vs-prisma-2026/
- https://www.messagecentral.com/blog/otp-sms-pricing-nigeria

Attempted, not retrieved (U):
- https://africastalking.com/sms/pricing (HTTP 403)
