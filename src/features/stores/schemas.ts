import { z } from "zod";

// Mirrors the CHECK constraints on `stores`. The reserved slug list and the
// final slug rules come with Seller sign up (feature 5).
export const STORE_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export const storeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(STORE_SLUG, "Use 1 to 50 lowercase letters, numbers or hyphens");

export const createStoreSchema = z.object({
  name: z.string().trim().min(1, "Enter your store name").max(80, "At most 80 characters"),
  slug: storeSlugSchema,
});

export type CreateStoreInput = z.input<typeof createStoreSchema>;
