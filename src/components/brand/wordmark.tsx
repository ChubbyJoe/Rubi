import { WARM_LIGHT } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

// The dot is the brand mark itself, so it stays Madder on every surface
// (dark Admin, a shop with its own accent); it never follows --primary.
const MADDER = WARM_LIGHT.primary;

/**
 * Lowercase "rubi" in Satoshi 700: "rub" plus a dotless ı stem in ink with a
 * round Madder dot over it. Size it with a font size class.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Rubi"
      className={cn(
        "inline-block font-sans leading-none font-bold tracking-[-0.05em] whitespace-nowrap text-foreground",
        className,
      )}
    >
      <span aria-hidden="true">
        rub
        {/* A zero size box on the baseline, just before the stem. The dot sits
            0.08em above Satoshi's x-height (0.494em), centred on the stem
            (0.124em from the glyph origin), as in the design mockups. */}
        <span className="relative inline-block size-0">
          <span
            className="absolute bottom-[0.574em] left-[0.124em] size-[0.28em] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: MADDER }}
          />
        </span>
        ı
      </span>
    </span>
  );
}

/** The Madder dot alone: the icon rail, avatars and sizes below 20px. */
export function DotMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Rubi"
      className={cn("inline-block size-6 shrink-0 rounded-full", className)}
      style={{ backgroundColor: MADDER }}
    />
  );
}
