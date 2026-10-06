import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errorResponsesFor, jsonContent, requiresAuth } from "../../docs/openapiHelpers.js";
import { dataResponse } from "../../schemas/responseSchemas.js";
import { loginSchema, sessionSchema, signupSchema, userSchema } from "./authSchemas.js";

const refreshTokenCookie = z.object({
  refresh_token: z.string().optional().meta({
    description: "Set by login / signup / refresh. Path=/api/auth, HttpOnly, SameSite=Strict",
  }),
});

const setCookieHeader = z.object({
  "Set-Cookie": z.string().meta({
    description:
      "`access_token` (Path=/api) and `refresh_token` (Path=/api/auth), both HttpOnly and SameSite=Strict",
  }),
});

const sessionResponse = (description: string) => ({
  description,
  headers: setCookieHeader,
  content: jsonContent(dataResponse(sessionSchema)),
});

export const authPaths: ZodOpenApiPathsObject = {
  "/auth/signup": {
    post: {
      tags: ["Auth"],
      operationId: "signup",
      summary: "Create an account and start a session",
      requestBody: { required: true, content: jsonContent(signupSchema) },
      responses: {
        201: sessionResponse("Account created and signed in"),
        ...errorResponsesFor(400, 409),
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      operationId: "login",
      summary: "Sign in",
      description:
        "Rate limited per IP. After 5 failed attempts for the same email within 15 minutes, further attempts return 429 until the window expires.",
      requestBody: { required: true, content: jsonContent(loginSchema) },
      responses: {
        200: sessionResponse("Signed in"),
        ...errorResponsesFor(400, 401),
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      operationId: "refresh",
      summary: "Rotate the refresh token and issue a new access token",
      description:
        "The refresh token is single-use. Presenting one that was already rotated revokes every session in its family (reuse detection). Rate limited per IP, but requests without a refresh_token cookie are rejected with 401 before the rate limit, so anonymous visitors do not use up the login / signup limit.",
      requestParams: { cookie: refreshTokenCookie },
      responses: {
        200: sessionResponse("New tokens issued"),
        ...errorResponsesFor(401),
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      operationId: "logout",
      summary: "Revoke the refresh token and clear auth cookies",
      requestParams: { cookie: refreshTokenCookie },
      responses: {
        204: { description: "Signed out (also returned when there was no session)" },
        ...errorResponsesFor(),
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      operationId: "getCurrentUser",
      summary: "Get the signed-in user",
      security: requiresAuth,
      responses: {
        200: { description: "The signed-in user", content: jsonContent(dataResponse(userSchema)) },
        ...errorResponsesFor(401),
      },
    },
  },
};
