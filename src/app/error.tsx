"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p>Please try again. If it keeps happening, check your connection.</p>
      <button type="button" onClick={reset} className="self-start underline">
        Try again
      </button>
    </main>
  );
}
