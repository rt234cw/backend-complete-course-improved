import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errorResponsesFor, jsonContent, requiresAuth } from "../../docs/openapiHelpers.js";
import { idParamSchema } from "../../schemas/commonSchemas.js";
import { dataResponse, listResponse } from "../../schemas/responseSchemas.js";
import {
  addToWatchlistSchema,
  listWatchlistQuerySchema,
  patchWatchlistItemSchema,
  watchlistIdSchema,
  watchlistItemSchema,
  watchlistItemWithMovieSchema,
} from "./watchlistSchemas.js";

export const watchlistPaths: ZodOpenApiPathsObject = {
  "/watchlist": {
    get: {
      tags: ["Watchlist"],
      operationId: "listWatchlist",
      summary: "List the signed-in user's watchlist",
      description: "Newest first. Each item includes the full movie.",
      security: requiresAuth,
      requestParams: { query: listWatchlistQuerySchema },
      responses: {
        200: {
          description: "A page of watchlist items",
          content: jsonContent(listResponse(watchlistItemWithMovieSchema)),
        },
        ...errorResponsesFor(400, 401),
      },
    },
    post: {
      tags: ["Watchlist"],
      operationId: "addToWatchlist",
      summary: "Add a movie to the watchlist",
      security: requiresAuth,
      requestBody: { required: true, content: jsonContent(addToWatchlistSchema) },
      responses: {
        201: {
          description: "Added. `status` defaults to PLANNED",
          content: jsonContent(dataResponse(watchlistItemSchema)),
        },
        ...errorResponsesFor(400, 401, 404, 409),
      },
    },
  },
  "/watchlist/ids": {
    get: {
      tags: ["Watchlist"],
      operationId: "listWatchlistIds",
      summary: "List the signed-in user's watchlist as ids",
      description:
        "Every item, unpaginated, with only `id`, `movieId` and `status`. Meant for the client to mark which movies are already in the watchlist.",
      security: requiresAuth,
      responses: {
        200: {
          description: "All of the user's items, newest first",
          content: jsonContent(dataResponse(z.array(watchlistIdSchema))),
        },
        ...errorResponsesFor(401),
      },
    },
  },
  "/watchlist/{id}": {
    patch: {
      tags: ["Watchlist"],
      operationId: "updateWatchlistItem",
      summary: "Update status, rating or notes",
      security: requiresAuth,
      requestParams: { path: idParamSchema },
      requestBody: { required: true, content: jsonContent(patchWatchlistItemSchema) },
      responses: {
        200: {
          description: "Item updated",
          content: jsonContent(dataResponse(watchlistItemSchema)),
        },
        ...errorResponsesFor(400, 401, 404),
      },
    },
    delete: {
      tags: ["Watchlist"],
      operationId: "removeFromWatchlist",
      summary: "Remove an item from the watchlist",
      security: requiresAuth,
      requestParams: { path: idParamSchema },
      responses: {
        204: { description: "Item removed" },
        ...errorResponsesFor(400, 401, 404),
      },
    },
  },
};
