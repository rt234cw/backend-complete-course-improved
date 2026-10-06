import createClient from "openapi-fetch";
import { describe, expect, it } from "vitest";
import { ApiError } from "./apiError";
import { unwrap } from "./client";
import type { paths } from "./schema";

const clientReturning = (response: Response) =>
  createClient<paths>({
    baseUrl: "http://localhost/api",
    fetch: () => Promise.resolve(response),
  });

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected function to throw");
};

const MOVIE_ID = "8f0c6b8e-3a8d-4c55-9f6a-3f5c1f0b2a11";

describe("unwrap", () => {
  it("returns data from a successful response", async () => {
    const genres = [{ id: MOVIE_ID, name: "Drama" }];
    const result = await clientReturning(Response.json({ data: genres })).GET("/genres");

    expect(unwrap(result)).toEqual({ data: genres });
  });

  it("does not throw for a 204 response", async () => {
    const result = await clientReturning(new Response(null, { status: 204 })).DELETE(
      "/watchlist/{id}",
      { params: { path: { id: MOVIE_ID } } },
    );

    expect(() => {
      unwrap(result);
    }).not.toThrow();
  });

  it("throws an ApiError with the backend's code, message and details", async () => {
    const details = [{ location: "body" as const, path: "rating", message: "Too big" }];
    const result = await clientReturning(
      Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Request validation failed", details } },
        { status: 400 },
      ),
    ).PATCH("/watchlist/{id}", { params: { path: { id: MOVIE_ID } }, body: { rating: 11 } });

    const error = catchError(() => unwrap(result));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details,
    });
  });

  it("throws an ApiError when the error body is not JSON", async () => {
    const result = await clientReturning(
      new Response("An error occurred with your deployment", {
        status: 504,
        headers: { "Content-Type": "text/plain" },
      }),
    ).GET("/genres");

    const error = catchError(() => unwrap(result));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 504, code: "UNEXPECTED_RESPONSE" });
  });

  it("reads Retry-After from a 429 response", async () => {
    const result = await clientReturning(
      Response.json(
        { error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": "120" } },
      ),
    ).GET("/genres");

    const error = catchError(() => unwrap(result));

    expect(error).toMatchObject({ status: 429, retryAfterSeconds: 120 });
  });

  it("throws an ApiError when the error response has no body", async () => {
    const result = await clientReturning(new Response(null, { status: 502 })).GET("/genres");

    const error = catchError(() => unwrap(result));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: "UNEXPECTED_RESPONSE" });
  });
});
