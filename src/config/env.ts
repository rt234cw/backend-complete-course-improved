import "dotenv/config";
import { z } from "zod";

const DURATION_UNITS = { s: 1, m: 60, h: 60 * 60, d: 60 * 60 * 24 } as const;

const durationSchema = z
  .string()
  .regex(/^\d+[smhd]$/, "must look like 15m, 12h or 7d")
  .transform((value) => {
    const amount = Number(value.slice(0, -1));
    const unit = value.slice(-1) as keyof typeof DURATION_UNITS;
    return amount * DURATION_UNITS[unit];
  });

const originListSchema = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(z.array(z.url()));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_ISSUER: z.string().min(1).default("movie-watchlist-api"),
  JWT_AUDIENCE: z.string().min(1).default("movie-watchlist-client"),
  ACCESS_TOKEN_TTL: durationSchema.prefault("15m"),
  REFRESH_TOKEN_TTL: durationSchema.prefault("7d"),
  CORS_ORIGINS: originListSchema,
  SEED_DEMO_PASSWORD: z.string().min(8).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
