import type { Request, RequestHandler, Response } from "express";
import { UnauthorizedError } from "../../errors/AppError.js";
import { requireUser } from "../../middlewares/authMiddleware.js";
import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from "./authCookie.js";
import type { LoginInput, SignupInput } from "./authSchemas.js";
import * as authService from "./authService.js";
import type { AuthTokens, AuthUser } from "./authTypes.js";
import * as sessionService from "./sessionService.js";

type Params = Record<string, string>;

const sendSession = (res: Response, statusCode: number, user: AuthUser, tokens: AuthTokens) => {
  setAuthCookies(res, tokens);
  res.status(statusCode).json({ data: { user } });
};

const extractRefreshToken = (req: Request): string | undefined => {
  const cookieToken: unknown = req.cookies[REFRESH_COOKIE_NAME];

  return typeof cookieToken === "string" ? cookieToken : undefined;
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const signup: RequestHandler<Params, unknown, SignupInput> = async (req, res) => {
  const user = await authService.registerUser(req.body);

  //generate JWT
  const tokens = await sessionService.createSession(user.id);

  sendSession(res, 201, user, tokens);
};

export const login: RequestHandler<Params, unknown, LoginInput> = async (req, res) => {
  const user = await authService.authenticate(req.body);

  //generate JWT
  const tokens = await sessionService.createSession(user.id);

  sendSession(res, 200, user, tokens);
};

export const requireRefreshToken: RequestHandler = (req, _res, next) => {
  if (!extractRefreshToken(req)) {
    throw new UnauthorizedError("Refresh token required");
  }

  next();
};

export const refresh: RequestHandler = async (req, res) => {
  const rawRefreshToken = extractRefreshToken(req);

  if (!rawRefreshToken) {
    throw new UnauthorizedError("Refresh token required");
  }

  try {
    const { user, tokens } = await sessionService.refreshSession(rawRefreshToken);
    sendSession(res, 200, user, tokens);
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
};

export const logout: RequestHandler = async (req, res) => {
  const rawRefreshToken = extractRefreshToken(req);

  if (rawRefreshToken) {
    await sessionService.revokeSession(rawRefreshToken);
  }

  clearAuthCookies(res);

  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getUserById(requireUser(req).id);

  res.status(200).json({ data: user });
};
