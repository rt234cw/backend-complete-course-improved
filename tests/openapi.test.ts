import { randomUUID } from "node:crypto";
import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sessionSchema, userSchema } from "../src/modules/auth/authSchemas.js";
import { genreSchema } from "../src/modules/genre/genreSchemas.js";
import { movieSchema } from "../src/modules/movie/movieSchemas.js";
import {
  watchlistIdSchema,
  watchlistItemSchema,
  watchlistItemWithMovieSchema,
} from "../src/modules/watchlist/watchlistSchemas.js";
import { dataResponse, errorResponseSchema, listResponse } from "../src/schemas/responseSchemas.js";
import { authCookie, createClient } from "./helpers/client.js";
import {
  createGenre,
  createMovie,
  createUser,
  TEST_PASSWORD,
  uniqueEmail,
} from "./helpers/factories.js";

const expectToMatch = (schema: z.ZodType, body: unknown) => {
  const result = schema.safeParse(body);

  expect(result.success, result.error && z.prettifyError(result.error)).toBe(true);
};

describe("OpenAPI document", () => {
  it("serves a valid OpenAPI 3.1 document", async () => {
    const res = await createClient().get("/api/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    await expect(SwaggerParser.validate(res.body)).resolves.toBeDefined();
  });

  it("serves the Swagger UI page", async () => {
    const client = createClient();

    const page = await client.get("/api/docs");
    expect(page.status).toBe(200);
    expect(page.headers["content-type"]).toMatch(/^text\/html/);
    expect(page.text).toContain('integrity="sha384-');
    expect(page.headers["content-security-policy"]).toContain(
      "script-src 'self' https://cdn.jsdelivr.net",
    );

    const initializer = await client.get("/api/docs/swagger-initializer.js");
    expect(initializer.status).toBe(200);
    expect(initializer.headers["content-type"]).toMatch(
      /^application\/javascript|^text\/javascript/,
    );
  });

  it("keeps the strict CSP on every other route", async () => {
    const res = await createClient().get("/api/health");

    expect(res.headers["content-security-policy"]).toContain("script-src 'self';");
  });
});

describe("responses match the documented schemas", () => {
  it("auth", async () => {
    const email = uniqueEmail();
    const browser = createClient();

    const signup = await browser
      .post("/api/auth/signup")
      .send({ name: "Docs User", email, password: TEST_PASSWORD });
    expect(signup.status).toBe(201);
    expectToMatch(dataResponse(sessionSchema), signup.body);

    const me = await browser.get("/api/auth/me");
    expect(me.status).toBe(200);
    expectToMatch(dataResponse(userSchema), me.body);
  });

  it("movies and genres", async () => {
    const { user } = await createUser();
    const genre = await createGenre("Drama");
    const movie = await createMovie(user.id, {
      overview: "Overview",
      posterUrl: "https://example.com/poster.jpg",
      genreIds: [genre.id],
    });
    await createMovie(user.id);
    const client = createClient();

    const list = await client.get("/api/movies");
    expect(list.status).toBe(200);
    expectToMatch(listResponse(movieSchema), list.body);

    const detail = await client.get(`/api/movies/${movie.id}`);
    expect(detail.status).toBe(200);
    expectToMatch(dataResponse(movieSchema), detail.body);

    const genres = await client.get("/api/genres");
    expect(genres.status).toBe(200);
    expectToMatch(dataResponse(z.array(genreSchema)), genres.body);
  });

  it("watchlist", async () => {
    const { user, accessToken } = await createUser();
    const movie = await createMovie(user.id);
    const client = createClient();

    const added = await client
      .post("/api/watchlist")
      .set(authCookie(accessToken))
      .send({ movieId: movie.id, rating: 8, notes: "Docs" });
    expect(added.status).toBe(201);
    expectToMatch(dataResponse(watchlistItemSchema), added.body);

    const updated = await client
      .patch(`/api/watchlist/${added.body.data.id}`)
      .set(authCookie(accessToken))
      .send({ status: "WATCHING" });
    expect(updated.status).toBe(200);
    expectToMatch(dataResponse(watchlistItemSchema), updated.body);

    const list = await client.get("/api/watchlist").set(authCookie(accessToken));
    expect(list.status).toBe(200);
    expectToMatch(listResponse(watchlistItemWithMovieSchema), list.body);

    const ids = await client.get("/api/watchlist/ids").set(authCookie(accessToken));
    expect(ids.status).toBe(200);
    expectToMatch(dataResponse(z.array(watchlistIdSchema)), ids.body);
  });

  it("errors", async () => {
    const client = createClient();

    const validation = await client.get("/api/movies?limit=999");
    expect(validation.status).toBe(400);
    expectToMatch(errorResponseSchema, validation.body);

    const unauthorized = await client.get("/api/auth/me");
    expect(unauthorized.status).toBe(401);
    expectToMatch(errorResponseSchema, unauthorized.body);

    const notFound = await client.get(`/api/movies/${randomUUID()}`);
    expect(notFound.status).toBe(404);
    expectToMatch(errorResponseSchema, notFound.body);
  });
});
