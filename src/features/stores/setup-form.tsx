"use client";

import { useActionState } from "react";
import { createStoreAction, type SetupState } from "./actions";

// Placeholder store setup for the Data model thread. Seller sign up
// (feature 5) replaces it with the real flow and the design system.
export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(createStoreAction, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        Store name
        <input name="name" required maxLength={80} className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1">
        Store link
        <input
          name="slug"
          required
          maxLength={50}
          autoCapitalize="none"
          autoCorrect="off"
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded bg-foreground px-3 py-2 text-background disabled:opacity-60"
      >
        {pending ? "Please wait…" : "Create store"}
      </button>
    </form>
  );
}
