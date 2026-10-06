import { z } from "zod";
import type {
  oas31,
  ZodOpenApiContentObject,
  ZodOpenApiResponseObject,
  ZodOpenApiResponsesObject,
} from "zod-openapi";
import { errorResponseSchema } from "../schemas/responseSchemas.js";

export const jsonContent = (schema: z.ZodType): ZodOpenApiContentObject => ({
  "application/json": { schema },
});

const errorResponse = (id: string, description: string): ZodOpenApiResponseObject => ({
  id,
  description,
  content: jsonContent(errorResponseSchema),
});

const errorResponses = {
  400: errorResponse(
    "BadRequest",
    "`VALIDATION_ERROR` (see `details`) or `INVALID_JSON` (malformed body)",
  ),
  401: errorResponse("Unauthorized", "Missing, invalid or expired credentials"),
  404: errorResponse(
    "NotFound",
    "The resource does not exist, or it belongs to another user (never 403, to avoid leaking existence)",
  ),
  409: errorResponse("Conflict", "The resource already exists"),
  429: {
    ...errorResponse("TooManyRequests", "Rate limit exceeded"),
    headers: z.object({
      "Retry-After": z.string().meta({ description: "Seconds to wait before retrying" }),
    }),
  },
} satisfies Record<number, ZodOpenApiResponseObject>;

type ErrorStatus = Exclude<keyof typeof errorResponses, 429>;

export const errorResponsesFor = (...statuses: ErrorStatus[]): ZodOpenApiResponsesObject => {
  const responses: ZodOpenApiResponsesObject = { 429: errorResponses[429] };

  for (const status of statuses) {
    responses[`${status}`] = errorResponses[status];
  }

  return responses;
};

export const requiresAuth: oas31.SecurityRequirementObject[] = [
  { cookieAuth: [] },
  { bearerAuth: [] },
];
