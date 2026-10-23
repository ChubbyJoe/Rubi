"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="self-start underline"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/sign-in");
      }}
    >
      Sign out
    </button>
  );
}
