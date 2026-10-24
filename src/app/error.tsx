"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16"
    >
      <Wordmark className="mb-4 text-[1.75rem]" />
      <h1 className="text-display-xl">Something went wrong</h1>
      <p className="text-body-md text-body">
        Please try again. If it keeps happening, check your connection.
      </p>
      <Button type="button" onClick={reset} className="self-start">
        Try again
      </Button>
    </main>
  );
}
