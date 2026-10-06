import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errorResponsesFor, jsonContent } from "../../docs/openapiHelpers.js";
import { dataResponse } from "../../schemas/responseSchemas.js";
import { genreSchema } from "./genreSchemas.js";

export const genrePaths: ZodOpenApiPathsObject = {
  "/genres": {
    get: {
      tags: ["Genres"],
      operationId: "listGenres",
      summary: "List all genres",
      responses: {
        200: {
          description: "All genres, sorted by name",
          content: jsonContent(dataResponse(z.array(genreSchema))),
        },
        ...errorResponsesFor(),
      },
    },
  },
};
