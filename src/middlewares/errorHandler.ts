import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  TooManyRequestsError,
} from "../errors/AppError.js";

type HttpError = Error & { status: number; type?: string; expose?: boolean };

const isHttpError = (err: unknown): err is HttpError =>
  err instanceof Error && typeof (err as Partial<HttpError>).status === "number";

const toAppError = (err: unknown): AppError => {
  if (err instanceof AppError) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return new ConflictError();
    if (err.code === "P2025") return new NotFoundError();
  }

  if (isHttpError(err) && err.expose && err.status < 500) {
    if (err.type === "entity.parse.failed") {
      return new BadRequestError("Malformed JSON body", "INVALID_JSON");
    }
    if (err.type === "entity.too.large") {
      return new PayloadTooLargeError();
    }
    return new AppError(err.status, "BAD_REQUEST", err.message);
  }

  return new AppError(500, "INTERNAL_ERROR", "Something went wrong");
};

export const notFound: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.path} not found`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);

  if (appError.statusCode >= 500) {
    req.log.error({ err }, "Unhandled error");
  }

  if (appError instanceof TooManyRequestsError) {
    res.setHeader("Retry-After", String(appError.retryAfterSeconds));
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
    },
  });
};
