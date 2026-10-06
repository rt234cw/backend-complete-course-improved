import type { Request, RequestHandler } from "express";
import type { z, ZodType } from "zod";
import { ValidationError, type ErrorDetail } from "../errors/AppError.js";

type RequestSchemas = {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
};

type Output<Schema, Fallback> = Schema extends ZodType ? z.output<Schema> : Fallback;

type ValidatedRequestHandler<Schemas extends RequestSchemas> = RequestHandler<
  Output<Schemas["params"], Request["params"]>,
  unknown,
  Output<Schemas["body"], Request["body"]>,
  Output<Schemas["query"], Request["query"]>
>;

const locations = ["params", "query", "body"] as const;

export const validateRequest = <Schemas extends RequestSchemas>(
  schemas: Schemas,
): ValidatedRequestHandler<Schemas> => {
  const handler: RequestHandler = (req, _res, next) => {
    const details: ErrorDetail[] = [];

    for (const location of locations) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);

      if (!result.success) {
        details.push(
          ...result.error.issues.map((issue) => ({
            location,
            path: issue.path.join("."),
            message: issue.message,
          })),
        );
        continue;
      }

      if (location === "query") {
        Object.defineProperty(req, "query", { value: result.data, enumerable: true });
      } else {
        req[location] = result.data;
      }
    }

    if (details.length > 0) {
      throw new ValidationError(details);
    }

    next();
  };

  return handler as ValidatedRequestHandler<Schemas>;
};
