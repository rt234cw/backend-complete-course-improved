import type { RequestHandler } from "express";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { TooManyRequestsError } from "../errors/AppError.js";
import { isRateLimiterRes, toRetryAfterSeconds } from "../lib/rateLimiter.js";

export const rateLimit = (limiter: RateLimiterAbstract): RequestHandler => {
  return async (req, _res, next) => {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";

    try {
      await limiter.consume(key);
    } catch (error) {
      if (isRateLimiterRes(error)) {
        throw new TooManyRequestsError(toRetryAfterSeconds(error));
      }
      throw error;
    }

    next();
  };
};
