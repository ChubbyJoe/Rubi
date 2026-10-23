"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { getSignedInUser } from "@/lib/auth/session";
import { createStore } from "./create-store";
import { storeSlugTag } from "./storefront";

export type SetupState = { readonly error?: string };

const messages = {
  slug_taken: "That store link is taken. Try another one.",
  invalid: "Check your store name and link.",
} as const;

export async function createStoreAction(_: SetupState, formData: FormData): Promise<SetupState> {
  const user = await getSignedInUser();
  const result = await createStore(user.userId, {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  });
  if (!result.ok) return { error: messages[result.error] };

  // A visit before the store existed may have cached a not found page.
  updateTag(storeSlugTag(result.data.slug));
  redirect("/app");
}
