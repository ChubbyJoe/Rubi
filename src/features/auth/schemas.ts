import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Enter your name"),
});
