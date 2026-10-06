import {
  RateLimiterMemory,
  RateLimiterPrisma,
  RateLimiterRes,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { isProduction } from "../config/env.js";
import { prisma } from "./prisma.js";

const FIFTEEN_MINUTES = 15 * 60;

type RateLimiterOptions = ConstructorParameters<typeof RateLimiterMemory>[0];

const createRateLimiter = (options: RateLimiterOptions): RateLimiterAbstract => {
  if (!isProduction) {
    return new RateLimiterMemory(options);
  }

  return new RateLimiterPrisma({
    ...options,
    storeClient: prisma,
    tableName: "rateLimiterFlexible",
    insuranceLimiter: new RateLimiterMemory(options),
  });
};

export const globalRateLimiter = createRateLimiter({
  keyPrefix: "global",
  points: 300,
  duration: FIFTEEN_MINUTES,
});

export const authRateLimiter = createRateLimiter({
  keyPrefix: "auth",
  points: 10,
  duration: FIFTEEN_MINUTES,
});

export const loginFailureLimiter = createRateLimiter({
  keyPrefix: "login_failure",
  points: 5,
  duration: FIFTEEN_MINUTES,
});

export const isRateLimiterRes = (value: unknown): value is RateLimiterRes =>
  value instanceof RateLimiterRes;

export const toRetryAfterSeconds = (res: RateLimiterRes) =>
  Math.max(1, Math.ceil(res.msBeforeNext / 1000));
