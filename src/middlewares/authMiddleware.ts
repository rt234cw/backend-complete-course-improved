import type { Request, RequestHandler } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { ACCESS_COOKIE_NAME } from "../modules/auth/authCookie.js";
import type { AuthenticatedUser } from "../modules/auth/authTypes.js";
import { verifyAccessToken } from "../modules/auth/token.js";

const BEARER_PREFIX = "Bearer ";

const extractToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;

  if (header?.startsWith(BEARER_PREFIX)) {
    return header.slice(BEARER_PREFIX.length);
  }

  const cookieToken: unknown = req.cookies[ACCESS_COOKIE_NAME];

  return typeof cookieToken === "string" ? cookieToken : undefined;
};

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new UnauthorizedError();
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  req.user = { id: userId };
  next();
};

export const requireUser = (req: Pick<Request, "user">): AuthenticatedUser => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  return req.user;
};
