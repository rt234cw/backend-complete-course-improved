import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../../config/env.js";
import type { AuthTokens } from "./authTypes.js";

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

const ACCESS_COOKIE_PATH = "/api";
const REFRESH_COOKIE_PATH = "/api/auth";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
};

const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: ACCESS_COOKIE_PATH,
  maxAge: env.ACCESS_TOKEN_TTL * 1000,
};

const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: REFRESH_COOKIE_PATH,
  maxAge: env.REFRESH_TOKEN_TTL * 1000,
};

export const setAuthCookies = (res: Response, tokens: AuthTokens) => {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res: Response) => {
  //new Date(0) 代表 Unix 時間戳 0 毫秒，也就是 1970-01-01 00:00:00 UTC，一個早就過去的時間點
  const expired = { expires: new Date(0) };

  res.cookie(ACCESS_COOKIE_NAME, "", {
    ...baseCookieOptions,
    path: ACCESS_COOKIE_PATH,
    ...expired,
  });
  res.cookie(REFRESH_COOKIE_NAME, "", {
    ...baseCookieOptions,
    path: REFRESH_COOKIE_PATH,
    ...expired,
  });
};
