import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </main>
  );
}
