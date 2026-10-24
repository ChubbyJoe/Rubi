import Link from "next/link";
import { Wordmark } from "./wordmark";

/** "Powered by rubi" for the shop footer; the only Madder in a shop. */
export function PoweredBy() {
  return (
    <Link
      href="/sign-up"
      className="relative inline-flex items-baseline gap-1 text-caption-sm text-muted-foreground after:absolute after:inset-x-0 after:-inset-y-3.5"
    >
      Powered by
      <Wordmark className="text-[1.0625rem]" />
    </Link>
  );
}
