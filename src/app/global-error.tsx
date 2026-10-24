"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
// Replaces the root layout, so it brings its own styles. No surface marker:
// it stays Rubi light. Satoshi is not loaded here; the fallback stack draws it.
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <main
          id="main"
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16"
        >
          <Wordmark className="mb-4 text-[1.75rem]" />
          <h1 className="text-display-xl">Something went wrong</h1>
          <p className="text-body-md text-body">Please try again.</p>
          <Button type="button" onClick={reset} className="self-start">
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
