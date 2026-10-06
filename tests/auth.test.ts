import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { authCookie, createClient } from "./helpers/client.js";
import { findCookie, getCookieValue } from "./helpers/cookies.js";
import { createUser, TEST_PASSWORD, uniqueEmail } from "./helpers/factories.js";

const signupBody = (overrides: Record<string, unknown> = {}) => ({
  name: "Alice",
  email: uniqueEmail(),
  password: TEST_PASSWORD,
  ...overrides,
});

const loginForRefreshToken = async (email: string) => {
  const res = await createClient().post("/api/auth/login").send({ email, password: TEST_PASSWORD });

  expect(res.status).toBe(200);
  return getCookieValue(res, "refresh_token");
};

const refreshWith = (refreshToken: string) =>
  createClient().post("/api/auth/refresh").set("Cookie", `refresh_token=${refreshToken}`);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/auth/signup", () => {
  it("creates a user and sets httpOnly auth cookies without exposing tokens in the body", async () => {
    const res = await createClient()
      .post("/api/auth/signup")
      .send(signupBody({ name: "  Alice  " }));

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      user: { id: expect.any(String), name: "Alice", email: expect.any(String) },
    });

    const accessCookie = findCookie(res, "access_token");
    const refreshCookie = findCookie(res, "refresh_token");
    expect(accessCookie).toMatch(/Path=\/api;.*HttpOnly.*SameSite=Strict/);
    expect(refreshCookie).toMatch(/Path=\/api\/auth;.*HttpOnly.*SameSite=Strict/);
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    const body = signupBody();
    await createClient().post("/api/auth/signup").send(body);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: body.email } });

    expect(user.password).not.toBe(TEST_PASSWORD);
    expect(user.password).toMatch(/^\$2b\$12\$/);
  });

  it("normalizes the email to trimmed lower case", async () => {
    const res = await createClient()
      .post("/api/auth/signup")
      .send(signupBody({ email: "  Mixed.Case@Example.COM " }));

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("mixed.case@example.com");
  });

  it("returns 409 when the email is already registered (case-insensitive)", async () => {
    const { user } = await createUser();

    const res = await createClient()
      .post("/api/auth/signup")
      .send(signupBody({ email: user.email.toUpperCase() }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects passwords longer than 72 bytes even when under 72 characters", async () => {
    const res = await createClient()
      .post("/api/auth/signup")
      .send(signupBody({ password: "密".repeat(25) }));

    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatchObject({ path: "password" });
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the right password", async () => {
    const { user } = await createUser();

    const res = await createClient()
      .post("/api/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(user);
    expect(findCookie(res, "access_token")).toBeDefined();
  });

  it("returns the same 401 for a wrong password and an unknown email", async () => {
    const { user } = await createUser();

    const wrongPassword = await createClient()
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" });
    const unknownEmail = await createClient()
      .post("/api/auth/login")
      .send({ email: uniqueEmail(), password: "wrong-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("still runs bcrypt.compare when the email does not exist (timing attack)", async () => {
    const compare = vi.spyOn(bcrypt, "compare");

    await createClient()
      .post("/api/auth/login")
      .send({ email: uniqueEmail(), password: "whatever-password" });

    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare.mock.calls[0]?.[1]).toMatch(/^\$2b\$12\$/);
  });

  it("locks the account for 15 minutes after 5 failed attempts, even from different IPs", async () => {
    const { user } = await createUser();

    for (let i = 0; i < 5; i += 1) {
      const res = await createClient()
        .post("/api/auth/login")
        .send({ email: user.email, password: "wrong-password" });
      expect(res.status).toBe(401);
    }

    const locked = await createClient()
      .post("/api/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(locked.status).toBe(429);
    expect(locked.body.error.message).toBe(
      "Too many failed login attempts, please try again later",
    );
    expect(Number(locked.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("resets the failure counter after a successful login", async () => {
    const { user } = await createUser();
    const fail = () =>
      createClient()
        .post("/api/auth/login")
        .send({ email: user.email, password: "wrong-password" });

    for (let i = 0; i < 4; i += 1) await fail();
    await loginForRefreshToken(user.email);
    for (let i = 0; i < 4; i += 1) await fail();

    const res = await createClient()
      .post("/api/auth/login")
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/refresh", () => {
  it("rotates the refresh token using cookies", async () => {
    const client = createClient();
    const signup = await client.post("/api/auth/signup").send(signupBody());
    const firstToken = getCookieValue(signup, "refresh_token");

    const res = await client.post("/api/auth/refresh");
    const secondToken = getCookieValue(res, "refresh_token");

    expect(res.status).toBe(200);
    expect(secondToken).not.toBe(firstToken);
    expect(findCookie(res, "access_token")).toBeDefined();
  });

  it("rejects an already used refresh token and revokes the whole family (reuse detection)", async () => {
    const { user } = await createUser();
    const stolenToken = await loginForRefreshToken(user.email);

    const rotated = await refreshWith(stolenToken);
    expect(rotated.status).toBe(200);

    const reused = await refreshWith(stolenToken);
    expect(reused.status).toBe(401);

    const legitimate = await refreshWith(getCookieValue(rotated, "refresh_token"));
    expect(legitimate.status).toBe(401);

    const activeTokens = await prisma.refreshToken.count({
      where: { userId: user.id, revokedAt: null },
    });
    expect(activeTokens).toBe(0);
  });

  it("lets only one of two concurrent refreshes with the same token succeed", async () => {
    const { user } = await createUser();
    const refreshToken = await loginForRefreshToken(user.email);

    const results = await Promise.all([refreshWith(refreshToken), refreshWith(refreshToken)]);

    expect(results.map((res) => res.status).sort()).toEqual([200, 401]);
  });

  it("does not revoke other sessions (families) of the same user", async () => {
    const { user } = await createUser();
    const phone = await loginForRefreshToken(user.email);
    const laptop = await loginForRefreshToken(user.email);

    await refreshWith(phone);
    await refreshWith(phone);

    const res = await refreshWith(laptop);
    expect(res.status).toBe(200);
  });

  it("rejects an expired refresh token", async () => {
    const { user } = await createUser();
    const refreshToken = await loginForRefreshToken(user.email);
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await refreshWith(refreshToken);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Refresh token expired");
  });

  it("returns 401 and clears cookies when no or an unknown refresh token is sent", async () => {
    const missing = await createClient().post("/api/auth/refresh");
    const unknown = await createClient()
      .post("/api/auth/refresh")
      .set("Cookie", "refresh_token=not-a-real-token");

    expect(missing.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(findCookie(unknown, "refresh_token")).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token on the server and clears cookies", async () => {
    const client = createClient();
    const signup = await client.post("/api/auth/signup").send(signupBody());
    const refreshToken = getCookieValue(signup, "refresh_token");

    const logout = await client.post("/api/auth/logout");

    expect(logout.status).toBe(204);
    expect(findCookie(logout, "access_token")).toMatch(/Expires=Thu, 01 Jan 1970/);

    const res = await createClient()
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user using the access token cookie", async () => {
    const client = createClient();
    const signup = await client.post("/api/auth/signup").send(signupBody());

    const res = await client.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(signup.body.data.user);
  });

  it("accepts the access token as an Authorization: Bearer header", async () => {
    const { user, accessToken } = await createUser();

    const res = await createClient()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(user);
  });

  it("prefers the Authorization header over the cookie", async () => {
    const { user, accessToken } = await createUser();
    const { accessToken: otherToken } = await createUser();

    const res = await createClient()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .set(authCookie(otherToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it("returns 401 without a token", async () => {
    const res = await createClient().get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each([
    [
      "expired",
      (userId: string) =>
        jwt.sign({ exp: Math.floor(Date.now() / 1000) - 10 }, env.JWT_SECRET, {
          subject: userId,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
        }),
    ],
    [
      "signed with another secret",
      (userId: string) =>
        jwt.sign({}, "another-secret-that-is-at-least-32-chars", {
          subject: userId,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
        }),
    ],
    [
      "for another audience",
      (userId: string) =>
        jwt.sign({}, env.JWT_SECRET, {
          subject: userId,
          issuer: env.JWT_ISSUER,
          audience: "someone-else",
        }),
    ],
    [
      "using alg none",
      (userId: string) =>
        jwt.sign({}, "", {
          algorithm: "none",
          subject: userId,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
        }),
    ],
  ])("returns 401 for an access token %s", async (_label, makeToken) => {
    const { user } = await createUser();

    const res = await createClient()
      .get("/api/auth/me")
      .set(authCookie(makeToken(user.id)));

    expect(res.status).toBe(401);
  });

  it("returns 401 when the user behind a valid token was deleted", async () => {
    const { user, accessToken } = await createUser();
    await prisma.user.delete({ where: { id: user.id } });

    const res = await createClient().get("/api/auth/me").set(authCookie(accessToken));

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("User no longer exists");
  });
});
