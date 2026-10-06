import { z } from "zod";

export const paginationMetaSchema = z
  .strictObject({
    page: z.number().int().meta({ example: 1 }),
    limit: z.number().int().meta({ example: 20 }),
    total: z.number().int().meta({ example: 42 }),
    totalPages: z.number().int().meta({ example: 3 }),
  })
  .meta({ id: "PaginationMeta" });

export const errorResponseSchema = z
  .strictObject({
    error: z.strictObject({
      code: z.string().meta({
        description: "Stable, machine-readable error code",
        example: "VALIDATION_ERROR",
      }),
      message: z.string().meta({ example: "Request validation failed" }),
      details: z
        .array(
          z.strictObject({
            location: z.enum(["params", "query", "body"]).optional(),
            path: z.string().meta({ example: "releaseYear" }),
            message: z.string().meta({ example: "Too small: expected number to be >=1888" }),
          }),
        )
        .optional()
        .meta({ description: "Only present on VALIDATION_ERROR" }),
    }),
  })
  .meta({ id: "ErrorResponse" });

export const dataResponse = <Schema extends z.ZodType>(data: Schema) => z.strictObject({ data });

export const listResponse = <Schema extends z.ZodType>(item: Schema) =>
  z.strictObject({ data: z.array(item), meta: paginationMetaSchema });
