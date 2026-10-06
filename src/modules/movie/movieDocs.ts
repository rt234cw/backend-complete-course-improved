import type { ZodOpenApiPathsObject } from "zod-openapi";
import { errorResponsesFor, jsonContent } from "../../docs/openapiHelpers.js";
import { idParamSchema } from "../../schemas/commonSchemas.js";
import { dataResponse, listResponse } from "../../schemas/responseSchemas.js";
import { listMoviesQuerySchema, movieSchema } from "./movieSchemas.js";

export const moviePaths: ZodOpenApiPathsObject = {
  "/movies": {
    get: {
      tags: ["Movies"],
      operationId: "listMovies",
      summary: "List movies",
      description: "Paginated. Ties in the sort field are broken by id, so pages are stable.",
      requestParams: { query: listMoviesQuerySchema },
      responses: {
        200: { description: "A page of movies", content: jsonContent(listResponse(movieSchema)) },
        ...errorResponsesFor(400),
      },
    },
  },
  "/movies/{id}": {
    get: {
      tags: ["Movies"],
      operationId: "getMovie",
      summary: "Get a movie",
      requestParams: { path: idParamSchema },
      responses: {
        200: { description: "The movie", content: jsonContent(dataResponse(movieSchema)) },
        ...errorResponsesFor(400, 404),
      },
    },
  },
};
