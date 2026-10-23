# Stack tool discovery: Agent Skills and MCP servers

Date: 2026-10-23
Method: `npx -y skills find <tool>` (non-interactive, run with stdin closed and a 60s alarm, since macOS has no `timeout`). Confirmations via `npx -y skills add <owner>/<repo> --list` (list only, nothing installed). MCP candidates via web search. Excluded: Neon MCP, Vercel MCP, and the already-installed skills (architect, audit, check, debug, develop, document, scope, sync, test).

## Next.js 16 (App Router, Cache Components)
- vercel-labs/agent-skills@vercel-react-best-practices (830.5K installs). Confirmed y (repo lists 9 skills). Vercel maintained. React/Next performance guidance.
- vercel-labs/agent-skills@vercel-composition-patterns (412.8K). Confirmed y. Vercel maintained. Covers React 19 API changes.
- vercel-labs/agent-skills@deploy-to-vercel (166.3K). Confirmed y. Vercel maintained.
- vercel/next.js@next-cache-components-adoption (20.8K). Not list-confirmed. Source is the Next.js repo, so vendor maintained. Most specific to Cache Components.
- vercel/next.js@next-cache-components-optimizer (18.5K). Not list-confirmed. Same source.
- giuseppe-trisciuoglio/developer-kit@nextjs-app-router (3.8K). Community.

## React 19
- No official React skill found.
- vercel-labs/agent-skills@vercel-react-best-practices (see Next.js). Covers React 19 patterns.
- dotneet/claude-code-marketplace@typescript-react-reviewer (8.9K). Community.
- jeffallan/claude-skills@react-expert (5.4K). Community.
- grafana/skills@react-19-plugin-migration (4.1K). Grafana plugin specific, so low relevance.

## TypeScript
- wshobson/agents@typescript-advanced-types (91.6K). Community.
- No official TypeScript skill found. mattpocock/skills (migrate-to-shoehorn, setup-ts-deep-modules) are by a known TS educator, not the TS team.

## Tailwind CSS v4
- lombiq/tailwind-agent-skills@tailwind-4-docs (17.4K). Community, v4 focused.
- wshobson/agents@tailwind-design-system (69.9K). Community.
- secondsky/claude-skills@tailwind-v4-shadcn (8.1K). Community, covers v4 plus shadcn.
- No official Tailwind Labs skill found.

## shadcn/ui
- shadcn-ui/ui@shadcn (390.6K installs). Confirmed y (repo lists 2 skills: shadcn, migrate-radix-to-base). Maintainer: shadcn-ui org. Top candidate.
- shadcn-ui/ui@migrate-radix-to-base (43K). Confirmed y. Relevant only if migrating off Radix.
- shadcn/improve@improve (36.9K). Not list-confirmed.

## Drizzle ORM / drizzle-kit
- No official Drizzle skill found.
- giuseppe-trisciuoglio/developer-kit@drizzle-orm-patterns (5.3K). Community.
- oakoss/agent-skills@drizzle-orm (238). Community, low installs.
- lobehub/lobehub@drizzle (5.4K). Community.
- affaan-m/ecc@database-migrations (11.6K). Generic, not Drizzle specific.

## Neon Postgres
- neondatabase/agent-skills@neon-postgres (271.9K). Confirmed y (repo includes neon child skills; neon-postgres appeared in the find listing). Neon maintained. Top candidate.
- neondatabase/agent-skills@neon-postgres-branches (29.5K). Confirmed y. Neon maintained.
- neondatabase/agent-skills@neon-postgres-egress-optimizer (27.7K). Neon maintained.
- Note: the Neon repo also ships a `neon-auth` skill for Neon Managed Better Auth. Only relevant if Better Auth is hosted on Neon.

## Better Auth
- better-auth/skills@better-auth-best-practices (125.7K). Confirmed y (repo lists 6 skills). Maintainer: Better Auth org. Top candidate.
- better-auth/skills@create-auth (29.3K, listed as create-auth-skill). Confirmed y. Scaffolding.
- better-auth/skills@better-auth-security-best-practices (47.1K). Confirmed y.
- better-auth/skills@email-and-password-best-practices (46.2K). Not list-confirmed, same repo.
- better-auth/skills@two-factor-authentication-best-practices (34.1K). Same repo.
- better-auth/skills@organization-best-practices (36.3K). Same repo.

## Cloudflare R2
- cloudflare/skills@cloudflare (general Cloudflare skill). Confirmed y (repo lists 19 skills including cloudflare, wrangler, cf-cli, nextjs-on-cloudflare, workers-best-practices). Cloudflare maintained. No R2-specific skill inside that repo was seen.
- cloudflare/skills@wrangler (Cloudflare maintained). Confirmed y.
- cloudflare/skills@cf-cli (8.7K). Confirmed y. Covers R2 CLI commands.
- jezweb/claude-skills@cloudflare-r2 (462). Community, R2 specific.
- secondsky/claude-skills@cloudflare-r2 (286). Community, R2 specific.
- microsoft/azure-skills@azure-storage (563.7K). Not relevant (Azure, not R2).

## Serwist (PWA service worker)
- No Serwist-specific skill found. Searches for "Serwist" returned only generic PWA skills.
- just-mpm/conformai@nextjs-pwa (65 installs). Community, low signal.
- jakerains/agentskills@nextjs-pwa (27). Community, low signal.
- juanmorales1810/pwa-service-worker@pwa-service-worker (25). Community. Generic service worker guidance.
- Serwist itself is the Next.js PWA plugin. Check the serwist.pages.dev docs for any official agent docs.

## Zod
- No official Zod skill found.
- pproenca/dot-skills@zod (7K). Community.
- giuseppe-trisciuoglio/developer-kit@zod-validation-utilities (3.8K). Community.
- oakoss/agent-skills@zod-validation (190). Community.
- dobroslavradosavljevic/skills@zod (45). Community, low installs.

## React Hook Form
- No official React Hook Form skill found.
- pproenca/dot-skills@react-hook-form (3K). Community.
- jezweb/claude-skills@react-hook-form-zod (1.2K). Community. Covers RHF plus Zod.
- ovachiever/droid-tings@react-hook-form-zod (720). Community.

## Vitest
- antfu/skills@vitest (42.6K). Not list-confirmed. Maintainer: Anthony Fu, a core contributor to Vite and Vitest, but not the Vitest team. Best candidate by installs.
- pproenca/dot-skills@vitest (5.9K). Community.

## Playwright
- microsoft/playwright-cli@playwright-cli (193.7K). Confirmed y (repo lists playwright-cli and dev skills). Microsoft maintained. Top candidate.
- anthropics/skills@webapp-testing (185.4K). Anthropic maintained, not list-confirmed, browser test oriented.
- Note: agent-browser skills from third-party forks (101-skills, magentosh, qu-skills) are not vendor maintained. Skip.

## Vercel (hosting)
- vercel-labs/agent-skills@deploy-to-vercel (166.3K). Confirmed y. Vercel maintained. Top candidate.
- vercel-labs/agent-skills@vercel-react-best-practices (see Next.js).

## GitHub Actions
- No official GitHub Actions skill confirmed.
- wshobson/agents@github-actions-templates (17.4K). Community.
- callstackincubator/agent-skills@github-actions (10.8K). Community.
- github/awesome-copilot@gh-cli (21.2K). Official GitHub org, but a gh CLI skill, not Actions.
- openai/skills@gh-fix-ci (11.4K). OpenAI maintained, CI fixing.

## MCP servers
- Playwright: `claude mcp add playwright npx @playwright/mcp@latest` (npm package @playwright/mcp, Microsoft repo microsoft/playwright-mcp). Official y. Install details from third-party guides that reproduce the README. Verify flags against the GitHub README.
- shadcn: `npx shadcn@latest mcp init --client claude` (writes the .mcp.json entry; runs `npx shadcn@latest mcp`). Official y (ui.shadcn.com/docs/mcp). Reads registries from components.json.
- Next.js devtools: `claude mcp add next-devtools npx next-devtools-mcp@latest` (repo vercel/next-devtools-mcp). Official y (Vercel). Needs a running Next.js 16+ dev server; exposes /_next/mcp runtime tools. Telemetry opt-out: NEXT_TELEMETRY_DISABLED=1.
- Better Auth: hosted docs MCP at https://mcp.better-auth.com/mcp (setup: `npx auth@latest mcp --claude-code`). Official y. This is documentation search, not the Better Auth server-side MCP plugin (which turns your app into an OAuth provider; the docs say the older plugin is deprecated).
- Cloudflare: Workers Bindings MCP (repo cloudflare/mcp-server-cloudflare, endpoint reported as https://bindings.mcp.cloudflare.com/mcp; some pages show /sse). Official y (Cloudflare repo). Covers R2 buckets. OAuth 2.1, no API keys. Endpoint form unverified against Cloudflare docs.
- Drizzle: no official MCP found. Community options only: Drizzle Sentinel (schema lint and drift detection), defrex/drizzle-mcp (14 stars). Official n.
- React, TypeScript, Tailwind, Zod, RHF, Vitest, Serwist, GitHub Actions: no MCP server searched or found credible in this pass. Official n/a. Not searched in depth.

## Tools with no credible official result
- React 19, TypeScript, Tailwind CSS v4, Drizzle, Serwist, Zod, React Hook Form, GitHub Actions: no official Agent Skill from the vendor was found. Community candidates are listed above with install counts; treat them as unvetted.
- Serwist and Cloudflare R2 have no dedicated official skill, only the general Cloudflare skill.
