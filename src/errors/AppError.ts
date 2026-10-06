export type ErrorDetail = {
  location?: string;
  path: string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ErrorDetail[] | undefined;

  constructor(statusCode: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(400, code, message);
  }
}

export class ValidationError extends AppError {
  constructor(details: ErrorDetail[]) {
    super(400, "VALIDATION_ERROR", "Request validation failed", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Request body is too large") {
    super(413, "PAYLOAD_TOO_LARGE", message);
  }
}

export class TooManyRequestsError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = "Too many requests, please try again later") {
    super(429, "TOO_MANY_REQUESTS", message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
