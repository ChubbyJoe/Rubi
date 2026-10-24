import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 pb-16"
    >
      <h1 className="text-display-xl">Sign in</h1>
      <Suspense>
        <AuthForm mode="sign-in" />
      </Suspense>
    </main>
  );
}
