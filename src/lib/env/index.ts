import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Previews have no fixed URL, so auth and app URLs follow the deployment.
const previewUrl = (branchUrl?: string, deploymentUrl?: string) => {
  const host = branchUrl ?? deploymentUrl;
  return host ? `https://${host}` : undefined;
};

const isPreview = process.env.VERCEL_ENV === "preview";

export const env = createEnv({
  server: {
    PGHOST: z.string().min(1),
    PGHOST_UNPOOLED: z.string().min(1),
    PGDATABASE: z.string().min(1),
    RUBI_APP_DB_PASSWORD: z.string().min(1),
    DATABASE_URL_UNPOOLED: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    VERCEL_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
    // Optional until Add a product (feature 6).
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_IMAGE_BASE_URL: z.url().optional(),
  },
  runtimeEnv: {
    PGHOST: process.env.PGHOST,
    PGHOST_UNPOOLED: process.env.PGHOST_UNPOOLED,
    PGDATABASE: process.env.PGDATABASE,
    RUBI_APP_DB_PASSWORD: process.env.RUBI_APP_DB_PASSWORD,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: isPreview
      ? previewUrl(process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL)
      : process.env.BETTER_AUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
        ? previewUrl(
            process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
            process.env.NEXT_PUBLIC_VERCEL_URL,
          )
        : process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
