// The DESIGN.md color tokens, keyed by CSS variable name (without `--`).
// globals.css mirrors these by hand; tokens.test.ts fails on any drift, and
// contrast.test.ts holds every text and boundary pair to WCAG AA.

/** Warm light: `:root`. The Admin in light mode, Rubi light pages, default shops. */
export const WARM_LIGHT = {
  background: "#fcf7f8",
  foreground: "#2a1a1d",
  body: "#4a3539",
  "muted-foreground": "#6e5a5e",
  "muted-soft": "#9a888c",
  muted: "#f6eef0",
  secondary: "#f1e5e8",
  border: "#eadcdf",
  "hairline-soft": "#f2e8ea",
  input: "#987d83",
  ring: "#2a1a1d",
  primary: "#a31621",
  "primary-foreground": "#fcf7f8",
  "primary-active": "#7e1019",
  "primary-tint": "#edb8bd",
  "primary-mid": "#d4646d",
  destructive: "#b45309",
  "destructive-foreground": "#fcf7f8",
  "destructive-active": "#92400e",
  toast: "#2a1a1d",
  "toast-foreground": "#fcf7f8",
  "nav-indicator": "#a31621",
  "status-success-foreground": "#166534",
  "status-success": "#e7f3ea",
  "status-info-foreground": "#1d4ed8",
  "status-info": "#e8eefc",
  "status-attention-foreground": "#92400e",
  "status-attention": "#fbecdf",
  "status-neutral-foreground": "#6e5a5e",
  "status-neutral": "#f1e5e8",
  "legal-link": "#2563eb",
  "chart-1": "#a31621",
  "chart-2": "#4f86c6",
  "chart-3": "#edb8bd",
  "chart-4": "#d4646d",
  "chart-5": "#7e1019",
} as const;

export type ColorToken = keyof typeof WARM_LIGHT;

/**
 * Stone neutrals: `html:has([data-neutrals="stone"])`, shops with a custom
 * accent. Only the neutrals change; the seller theme sets primary and ring,
 * so `ring` here is the ink fallback used by the contrast test, not CSS.
 */
export const STONE_LIGHT = {
  background: "#fafaf9",
  foreground: "#1c1917",
  body: "#44403c",
  "muted-foreground": "#57534e",
  "muted-soft": "#a8a29e",
  muted: "#f5f5f4",
  secondary: "#efedeb",
  border: "#e7e5e4",
  "hairline-soft": "#f0eeec",
  input: "#8a8580",
  ring: "#1c1917",
  toast: "#1c1917",
  "toast-foreground": "#fafaf9",
  "status-neutral-foreground": "#57534e",
  "status-neutral": "#efedeb",
} as const satisfies Partial<Record<ColorToken, string>>;

/** Stone values the CSS stone block leaves to the seller theme. */
export const STONE_THEME_OWNED: readonly ColorToken[] = ["ring"];

/**
 * Admin dark: `prefers-color-scheme: dark` on `html:has([data-surface="admin"])`.
 * Status fills are not listed: CSS mixes 16% of the status text over the
 * canvas, and tests rebuild them with `blend`.
 */
export const ADMIN_DARK = {
  background: "#1f1719",
  foreground: "#f6eef0",
  body: "#ddd0d3",
  "muted-foreground": "#b8a7ab",
  "muted-soft": "#7d6a6e",
  muted: "#2a2023",
  secondary: "#352a2d",
  border: "#3d3034",
  "hairline-soft": "#33282b",
  input: "#8a767a",
  ring: "#f6eef0",
  primary: "#c4303b",
  "primary-foreground": "#fcf7f8",
  "primary-active": "#a8232d",
  "primary-tint": "#4a1418",
  "primary-mid": "#7e1f26",
  destructive: "#f0a868",
  "destructive-foreground": "#1f1719",
  "destructive-active": "#f5bd8a",
  toast: "#fcf7f8",
  "toast-foreground": "#2a1a1d",
  "nav-indicator": "#d9505a",
  "status-success-foreground": "#4ade80",
  "status-info-foreground": "#93b4f5",
  "status-attention-foreground": "#f0a868",
  "status-neutral-foreground": "#b8a7ab",
  "legal-link": "#93b4f5",
  "chart-1": "#c4303b",
  "chart-2": "#4f86c6",
  "chart-3": "#4a1418",
  "chart-4": "#7e1f26",
  "chart-5": "#d9505a",
} as const satisfies Partial<Record<ColorToken, string>>;

export const STATUS_TONES = ["success", "info", "attention", "neutral"] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

/** Share of the status text mixed over the dark canvas for its fill. */
export const DARK_STATUS_FILL = 0.16;

export const SCRIM = { light: "rgb(0 0 0 / 0.5)", dark: "rgb(0 0 0 / 0.6)" } as const;

/** Float shadow; stone shops swap the last layer for `FLOAT_SHADOW_STONE_TAIL`. */
export const FLOAT_SHADOW =
  "rgba(42, 26, 29, 0.05) 0 0 0 1px, rgba(42, 26, 29, 0.05) 0 2px 6px 0, rgba(126, 16, 25, 0.1) 0 8px 20px -4px";
export const FLOAT_SHADOW_STONE =
  "rgba(42, 26, 29, 0.05) 0 0 0 1px, rgba(42, 26, 29, 0.05) 0 2px 6px 0, rgba(28, 25, 23, 0.08) 0 8px 20px -4px";

/**
 * The sample stone shop theme for `/dev/ui/shop?neutrals=stone` and the
 * contrast test. Feature 13 derives real themes from a seller's color.
 */
export const SAMPLE_STONE_THEME = {
  accent: "#0f766e",
  onAccent: "#fafaf9",
  accentActive: "#0b5e58",
  accentTint: "#d0e2e0",
  ring: "#0f766e",
} as const;
