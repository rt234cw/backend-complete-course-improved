import { describe, expect, it } from "vitest";
import { createUser, createMovie } from "./helpers/factories.js";
import { authCookie, createClient } from "./helpers/client.js";

describe("HTTP basics", () => {
  it("GET /api/health returns ok", async () => {
    const res = await createClient().get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: "ok" } });
  });

  it("sets security headers and a request id", async () => {
    const res = await createClient().get("/api/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("allows CORS only for whitelisted origins", async () => {
    const allowed = await createClient().get("/api/health").set("Origin", "http://localhost:5173");
    const blocked = await createClient().get("/api/health").set("Origin", "https://evil.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("errorHandler", () => {
  it("returns 404 in the standard error format for unknown routes", async () => {
    const res = await createClient().get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "Route GET /api/nope not found" },
    });
  });

  it("returns 400 INVALID_JSON for a malformed JSON body", async () => {
    const res = await createClient()
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: "INVALID_JSON", message: "Malformed JSON body" });
  });

  it("returns 413 when the body is larger than 10kb", async () => {
    const res = await createClient()
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "x".repeat(11 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("maps a Prisma unique violation (P2002) to 409 CONFLICT", async () => {
    const { user, accessToken } = await createUser();
    const movie = await createMovie(user.id);
    const client = createClient();

    const first = await client
      .post("/api/watchlist")
      .set(authCookie(accessToken))
      .send({ movieId: movie.id });
    const second = await client
      .post("/api/watchlist")
      .set(authCookie(accessToken))
      .send({ movieId: movie.id });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error).toEqual({ code: "CONFLICT", message: "Resource already exists" });
  });

  it("returns validation errors with location, path and message", async () => {
    const res = await createClient()
      .post("/api/auth/signup")
      .send({ name: "", email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ location: "body", path: "name" }),
        expect.objectContaining({ location: "body", path: "email" }),
        expect.objectContaining({ location: "body", path: "password" }),
      ]),
    );
  });
});

describe("rate limiting", () => {
  it("returns 429 with Retry-After after 10 auth requests from the same IP", async () => {
    const client = createClient();

    for (let i = 0; i < 10; i += 1) {
      const res = await client.post("/api/auth/signup").send({});
      expect(res.status).toBe(400);
    }

    const limited = await client.post("/api/auth/signup").send({});

    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("does not count refresh requests without a refresh token cookie", async () => {
    const client = createClient();

    for (let i = 0; i < 11; i += 1) {
      const res = await client.post("/api/auth/refresh");
      expect(res.status).toBe(401);
    }

    const signup = await client.post("/api/auth/signup").send({});

    expect(signup.status).toBe(400);
  });

  it("still counts refresh requests that send a refresh token cookie", async () => {
    const client = createClient();

    for (let i = 0; i < 10; i += 1) {
      const res = await client
        .post("/api/auth/refresh")
        .set("Cookie", "refresh_token=not-a-real-token");
      expect(res.status).toBe(401);
    }

    const limited = await client
      .post("/api/auth/refresh")
      .set("Cookie", "refresh_token=not-a-real-token");

    expect(limited.status).toBe(429);
  });

  it("counts each client IP separately", async () => {
    const first = createClient();
    for (let i = 0; i < 10; i += 1) {
      await first.post("/api/auth/signup").send({});
    }

    const other = await createClient().post("/api/auth/signup").send({});

    expect(other.status).toBe(400);
  });
});
