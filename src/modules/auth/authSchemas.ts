import { z } from "zod";

const BCRYPT_MAX_PASSWORD_BYTES = 72;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .meta({ description: "Trimmed and lowercased before use", example: "demo@example.com" });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => Buffer.byteLength(password, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES, {
    message: `Password must be at most ${BCRYPT_MAX_PASSWORD_BYTES} bytes`,
  })
  .meta({
    description: `8 characters to ${BCRYPT_MAX_PASSWORD_BYTES} bytes (UTF-8), the bcrypt input limit`,
    example: "correct-horse-battery",
  });

export const signupSchema = z
  .object({
    name: z.string().trim().min(1).max(50).meta({ example: "Demo User" }),
    email: emailSchema,
    password: passwordSchema,
  })
  .meta({ id: "SignupRequest" });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).meta({ example: "correct-horse-battery" }),
  })
  .meta({ id: "LoginRequest" });

export const userSchema = z
  .strictObject({
    id: z.uuid(),
    name: z.string().meta({ example: "Demo User" }),
    email: z.email().meta({ example: "demo@example.com" }),
  })
  .meta({ id: "User" });

export const sessionSchema = z.strictObject({ user: userSchema }).meta({
  id: "Session",
  description: "Tokens are only sent as HttpOnly cookies, never in the body",
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
