import { randomUUID } from "node:crypto";
import { WatchlistStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { authCookie, createClient } from "./helpers/client.js";
import { createMovie, createUser, createWatchlistItem } from "./helpers/factories.js";

type TestUser = Awaited<ReturnType<typeof createUser>>;

let alice: TestUser;
let bob: TestUser;

beforeEach(async () => {
  alice = await createUser({ name: "Alice" });
  bob = await createUser({ name: "Bob" });
});

describe("authentication", () => {
  it.each([
    ["GET", "/api/watchlist"],
    ["GET", "/api/watchlist/ids"],
    ["POST", "/api/watchlist"],
    ["PATCH", `/api/watchlist/${randomUUID()}`],
    ["DELETE", `/api/watchlist/${randomUUID()}`],
  ])("%s %s returns 401 without a token", async (method, path) => {
    const res =
      await createClient()[method.toLowerCase() as "get" | "post" | "patch" | "delete"](path);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/watchlist", () => {
  it("adds a movie with status PLANNED by default", async () => {
    const movie = await createMovie(alice.user.id);

    const res = await createClient()
      .post("/api/watchlist")
      .set(authCookie(alice.accessToken))
      .send({ movieId: movie.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      userId: alice.user.id,
      movieId: movie.id,
      status: "PLANNED",
    });
  });

  it("returns 404 when the movie does not exist", async () => {
    const res = await createClient()
      .post("/api/watchlist")
      .set(authCookie(alice.accessToken))
      .send({ movieId: randomUUID() });

    expect(res.status).toBe(404);
  });

  it("returns 409 when the movie is already in the watchlist", async () => {
    const movie = await createMovie(alice.user.id);
    await createWatchlistItem(alice.user.id, movie.id);

    const res = await createClient()
      .post("/api/watchlist")
      .set(authCookie(alice.accessToken))
      .send({ movieId: movie.id });

    expect(res.status).toBe(409);
  });

  it.each([
    ["an invalid status", { status: "LOVED" }],
    ["a rating above 10", { rating: 11 }],
    ["a non-integer rating", { rating: 7.5 }],
  ])("returns 400 for %s", async (_label, body) => {
    const movie = await createMovie(alice.user.id);

    const res = await createClient()
      .post("/api/watchlist")
      .set(authCookie(alice.accessToken))
      .send({ movieId: movie.id, ...body });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/watchlist", () => {
  it("returns only the current user's items, with the movie included", async () => {
    const movie = await createMovie(alice.user.id, { title: "Shared Movie" });
    await createWatchlistItem(alice.user.id, movie.id);
    await createWatchlistItem(bob.user.id, movie.id);

    const res = await createClient().get("/api/watchlist").set(authCookie(alice.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      userId: alice.user.id,
      movie: { id: movie.id, title: "Shared Movie", genres: [] },
    });
  });

  it("filters by status and paginates", async () => {
    for (let i = 0; i < 3; i += 1) {
      const movie = await createMovie(alice.user.id);
      await createWatchlistItem(alice.user.id, movie.id, WatchlistStatus.COMPLETED);
    }
    const planned = await createMovie(alice.user.id);
    await createWatchlistItem(alice.user.id, planned.id, WatchlistStatus.PLANNED);

    const res = await createClient()
      .get("/api/watchlist?status=COMPLETED&limit=2&page=2")
      .set(authCookie(alice.accessToken));

    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("COMPLETED");
  });

  it("returns 400 for a limit above 50", async () => {
    const res = await createClient()
      .get("/api/watchlist?limit=51")
      .set(authCookie(alice.accessToken));

    expect(res.status).toBe(400);
  });
});

describe("GET /api/watchlist/ids", () => {
  it("returns only the current user's items, with id, movieId and status only", async () => {
    const shared = await createMovie(alice.user.id);
    const aliceOnly = await createMovie(alice.user.id);
    await createWatchlistItem(alice.user.id, shared.id);
    await createWatchlistItem(alice.user.id, aliceOnly.id, WatchlistStatus.WATCHING);
    await createWatchlistItem(bob.user.id, shared.id);

    const res = await createClient().get("/api/watchlist/ids").set(authCookie(alice.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("meta");
    expect(res.body.data).toHaveLength(2);
    for (const item of res.body.data) {
      expect(Object.keys(item).sort()).toEqual(["id", "movieId", "status"]);
    }
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ movieId: shared.id, status: "PLANNED" }),
        expect.objectContaining({ movieId: aliceOnly.id, status: "WATCHING" }),
      ]),
    );
  });

  it("returns an empty array when the user has no items", async () => {
    const res = await createClient().get("/api/watchlist/ids").set(authCookie(alice.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("PATCH /api/watchlist/:id", () => {
  it("updates the owner's item", async () => {
    const movie = await createMovie(alice.user.id);
    const item = await createWatchlistItem(alice.user.id, movie.id);

    const res = await createClient()
      .patch(`/api/watchlist/${item.id}`)
      .set(authCookie(alice.accessToken))
      .send({ status: "COMPLETED", rating: 9, notes: "Great" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: "COMPLETED", rating: 9, notes: "Great" });
  });

  it("returns 404 when another user tries to update the item, and leaves it unchanged", async () => {
    const movie = await createMovie(alice.user.id);
    const item = await createWatchlistItem(alice.user.id, movie.id);

    const res = await createClient()
      .patch(`/api/watchlist/${item.id}`)
      .set(authCookie(bob.accessToken))
      .send({ rating: 1 });

    expect(res.status).toBe(404);
    const stored = await prisma.watchlistItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(stored.rating).toBeNull();
  });

  it("returns 404 for another user's item and for a missing item with the same body", async () => {
    const movie = await createMovie(alice.user.id);
    const item = await createWatchlistItem(alice.user.id, movie.id);

    const notMine = await createClient()
      .patch(`/api/watchlist/${item.id}`)
      .set(authCookie(bob.accessToken))
      .send({ rating: 1 });
    const missing = await createClient()
      .patch(`/api/watchlist/${randomUUID()}`)
      .set(authCookie(bob.accessToken))
      .send({ rating: 1 });

    expect(notMine.body).toEqual(missing.body);
  });

  it("returns 400 for an empty body and for an invalid id", async () => {
    const emptyBody = await createClient()
      .patch(`/api/watchlist/${randomUUID()}`)
      .set(authCookie(alice.accessToken))
      .send({});
    const badId = await createClient()
      .patch("/api/watchlist/not-a-uuid")
      .set(authCookie(alice.accessToken))
      .send({ rating: 5 });

    expect(emptyBody.status).toBe(400);
    expect(badId.status).toBe(400);
  });
});

describe("DELETE /api/watchlist/:id", () => {
  it("removes the owner's item", async () => {
    const movie = await createMovie(alice.user.id);
    const item = await createWatchlistItem(alice.user.id, movie.id);

    const res = await createClient()
      .delete(`/api/watchlist/${item.id}`)
      .set(authCookie(alice.accessToken));

    expect(res.status).toBe(204);
    expect(await prisma.watchlistItem.findUnique({ where: { id: item.id } })).toBeNull();
  });

  it("returns 404 when another user tries to delete the item, and keeps it", async () => {
    const movie = await createMovie(alice.user.id);
    const item = await createWatchlistItem(alice.user.id, movie.id);

    const res = await createClient()
      .delete(`/api/watchlist/${item.id}`)
      .set(authCookie(bob.accessToken));

    expect(res.status).toBe(404);
    expect(await prisma.watchlistItem.findUnique({ where: { id: item.id } })).not.toBeNull();
  });
});
