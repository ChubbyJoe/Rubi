"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { signInSchema, signUpSchema } from "./schemas";

// Placeholder email and password form for the scaffold. Seller sign up
// (feature 5) replaces it with the real methods and the design system.
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Only follow internal dashboard paths, never an outside URL.
  const nextParam = searchParams.get("next");
  const next = (nextParam?.startsWith("/app") ? nextParam : "/app") as Route;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (mode === "sign-up" ? signUpSchema : signInSchema).safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setPending(true);
    const { error: authError } =
      mode === "sign-up"
        ? await authClient.signUp.email(parsed.data as typeof signUpSchema._output)
        : await authClient.signIn.email(parsed.data);
    setPending(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      {mode === "sign-up" && (
        <label className="flex flex-col gap-1">
          Your name
          <input name="name" autoComplete="name" required className="rounded border px-3 py-2" />
        </label>
      )}
      <label className="flex flex-col gap-1">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
          minLength={8}
          className="rounded border px-3 py-2"
        />
      </label>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-3 py-2 text-background disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
      {mode === "sign-up" ? (
        <Link href="/sign-in" className="underline">
          I already have an account
        </Link>
      ) : (
        <Link href="/sign-up" className="underline">
          Create an account
        </Link>
      )}
    </form>
  );
}
