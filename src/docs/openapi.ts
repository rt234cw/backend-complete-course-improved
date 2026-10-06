import { z } from "zod";
import { createDocument } from "zod-openapi";
import { authPaths } from "../modules/auth/authDocs.js";
import { genrePaths } from "../modules/genre/genreDocs.js";
import { moviePaths } from "../modules/movie/movieDocs.js";
import { watchlistPaths } from "../modules/watchlist/watchlistDocs.js";
import { dataResponse } from "../schemas/responseSchemas.js";
import { errorResponsesFor, jsonContent } from "./openapiHelpers.js";

const description = `
Movie watchlist REST API.

**Authentication.** \`POST /auth/login\` sets two HttpOnly cookies and the browser sends them automatically, so "Try it out" works right after logging in on this page. Tokens are never returned in the response body.

**Responses.** Success: \`{ data }\`, lists: \`{ data, meta }\`, errors: \`{ error: { code, message, details? } }\`.

**Rate limits.** 300 requests per IP per 15 minutes overall; 10 per IP per 15 minutes on signup, login and refresh.
`.trim();

export const createOpenApiDocument = () =>
  createDocument({
    openapi: "3.1.0",
    info: {
      title: "Movie Watchlist API",
      version: "1.0.0",
      description,
    },
    servers: [{ url: "/api" }],
    tags: [
      { name: "Auth", description: "Sign up, sign in and session management" },
      { name: "Movies", description: "Shared movie catalog" },
      { name: "Genres" },
      { name: "Watchlist", description: "The signed-in user's personal watchlist" },
      { name: "System" },
    ],
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          operationId: "healthCheck",
          summary: "Liveness check",
          responses: {
            200: {
              description: "The server is up",
              content: jsonContent(dataResponse(z.strictObject({ status: z.literal("ok") }))),
            },
            ...errorResponsesFor(),
          },
        },
      },
      ...authPaths,
      ...moviePaths,
      ...genrePaths,
      ...watchlistPaths,
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "Set by login / signup / refresh. Browsers send it automatically",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "The same access token sent as `Authorization: Bearer <token>`. Checked before the cookie",
        },
      },
    },
  });
