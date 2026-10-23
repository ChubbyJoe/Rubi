import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

const deploymentOrigins = [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
  .filter((host): host is string => !!host)
  .map((host) => `https://${host}`);

export const auth = betterAuth({
  appName: "Rubi",
  // Explicit: previews and production derive this URL in src/lib/env, which
  // Better Auth would not see through process.env.
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Placeholder sign in for the scaffold. The real methods (phone OTP and
  // friends) are decided in the Seller sign up spec (feature 5).
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: { enabled: true, storage: "database" },
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL, ...deploymentOrigins],
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
