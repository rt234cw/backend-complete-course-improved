import type { components } from "./schema";

export type ApiErrorBody = components["schemas"]["ErrorResponse"]["error"];

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorBody["details"];
  readonly retryAfterSeconds: number | undefined;

  constructor(
    status: number,
    { code, message, details }: ApiErrorBody,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const isErrorBody = (body: unknown): body is { error: ApiErrorBody } => {
  if (typeof body !== "object" || body === null || !("error" in body)) return false;
  const { error } = body;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
};

const parseRetryAfter = (value: string | null): number | undefined => {
  const seconds = Number(value);
  return value && Number.isInteger(seconds) && seconds > 0 ? seconds : undefined;
};

export const toApiError = (response: Response, body: unknown): ApiError => {
  const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));

  if (isErrorBody(body)) return new ApiError(response.status, body.error, retryAfterSeconds);

  return new ApiError(
    response.status,
    { code: "UNEXPECTED_RESPONSE", message: `Request failed with status ${response.status}` },
    retryAfterSeconds,
  );
};
