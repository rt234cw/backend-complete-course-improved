import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { authCookie, createClient } from "./helpers/client.js";
import { createGenre, createMovie, createUser } from "./helpers/factories.js";

type Owner = Awaited<ReturnType<typeof createUser>>;

let owner: Owner;

beforeEach(async () => {
  owner = await createUser();
});

describe("GET /api/movies", () => {
  it("returns the first page with pagination meta, newest first", async () => {
    for (let i = 1; i <= 3; i += 1) {
      await createMovie(owner.user.id, {
        title: `Movie ${i}`,
        createdAt: new Date(Date.UTC(2026, 0, i)),
      });
    }

    const res = await createClient().get("/api/movies?limit=2");

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(res.body.data.map((movie: { title: string }) => movie.title)).toEqual([
      "Movie 3",
      "Movie 2",
    ]);
  });

  it("returns an empty list with totalPages 0 when there are no movies", async () => {
    const res = await createClient().get("/api/movies");

    expect(res.body).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });

  it("searches titles case-insensitively and treats % and _ as plain characters", async () => {
    await createMovie(owner.user.id, { title: "The Matrix" });
    await createMovie(owner.user.id, { title: "100% Wolf" });
    await createMovie(owner.user.id, { title: "Inception" });

    const matrix = await createClient().get("/api/movies?search=MATRIX");
    const percent = await createClient().get("/api/movies").query({ search: "%" });

    expect(matrix.body.data.map((movie: { title: string }) => movie.title)).toEqual(["The Matrix"]);
    expect(percent.body.data.map((movie: { title: string }) => movie.title)).toEqual(["100% Wolf"]);
  });

  it("filters by genre (case-insensitive) and year, and sorts by title", async () => {
    const sciFi = await createGenre("Sci-Fi");
    await createMovie(owner.user.id, { title: "B", releaseYear: 2010, genreIds: [sciFi.id] });
    await createMovie(owner.user.id, { title: "A", releaseYear: 2010, genreIds: [sciFi.id] });
    await createMovie(owner.user.id, { title: "C", releaseYear: 1999, genreIds: [sciFi.id] });
    await createMovie(owner.user.id, { title: "D", releaseYear: 2010 });

    const res = await createClient().get("/api/movies?genre=sci-fi&year=2010&sort=title&order=asc");

    expect(res.body.data.map((movie: { title: string }) => movie.title)).toEqual(["A", "B"]);
    expect(res.body.data[0].genres).toEqual([{ id: sciFi.id, name: "Sci-Fi" }]);
  });

  it.each([
    ["limit above 50", "limit=51"],
    ["limit 0", "limit=0"],
    ["page 0", "page=0"],
    ["page above 10000", "page=10001"],
    ["unknown sort field", "sort=password"],
    ["non-numeric year", "year=abc"],
  ])("returns 400 for %s", async (_label, query) => {
    const res = await createClient().get(`/api/movies?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].location).toBe("query");
  });
});

describe("GET /api/movies/:id", () => {
  it("returns a movie with its genres", async () => {
    const drama = await createGenre("Drama");
    const movie = await createMovie(owner.user.id, { genreIds: [drama.id] });

    const res = await createClient().get(`/api/movies/${movie.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: movie.id,
      genres: [{ id: drama.id, name: "Drama" }],
    });
  });

  it("returns 400 for an id that is not a UUID", async () => {
    const res = await createClient().get("/api/movies/123");

    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatchObject({ location: "params", path: "id" });
  });

  it("returns 404 for a movie that does not exist", async () => {
    const res = await createClient().get(`/api/movies/${randomUUID()}`);

    expect(res.status).toBe(404);
  });
});

describe("writing movies through the API", () => {
  it("is not possible, even for the movie's creator", async () => {
    const movie = await createMovie(owner.user.id, { title: "Original" });
    const client = createClient();
    const cookie = authCookie(owner.accessToken);

    const created = await client
      .post("/api/movies")
      .set(cookie)
      .send({ title: "New", releaseYear: 2020 });
    const updated = await client
      .patch(`/api/movies/${movie.id}`)
      .set(cookie)
      .send({ title: "Hacked" });
    const deleted = await client.delete(`/api/movies/${movie.id}`).set(cookie);

    expect([created.status, updated.status, deleted.status]).toEqual([404, 404, 404]);
    expect(await prisma.movie.findMany({ select: { title: true } })).toEqual([
      { title: "Original" },
    ]);
  });
});

describe("when the creator account is deleted", () => {
  it("keeps the movie and sets createdBy to null", async () => {
    const movie = await createMovie(owner.user.id);

    await prisma.user.delete({ where: { id: owner.user.id } });

    const stored = await prisma.movie.findUnique({ where: { id: movie.id } });
    expect(stored?.createdBy).toBeNull();
  });
});

describe("GET /api/genres", () => {
  it("returns all genres sorted by name", async () => {
    await createGenre("Thriller");
    await createGenre("Action");

    const res = await createClient().get("/api/genres");

    expect(res.status).toBe(200);
    expect(res.body.data.map((genre: { name: string }) => genre.name)).toEqual([
      "Action",
      "Thriller",
    ]);
  });
});
