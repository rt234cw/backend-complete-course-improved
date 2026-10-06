import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { WatchlistStatus } from "@prisma/client";
import { prisma } from "../../src/lib/prisma.js";
import { signAccessToken } from "../../src/modules/auth/token.js";

export const TEST_PASSWORD = "correct-horse-battery";

const FAST_BCRYPT_COST = 4;

let passwordHash: string | undefined;

const getPasswordHash = async () => {
  passwordHash ??= await bcrypt.hash(TEST_PASSWORD, FAST_BCRYPT_COST);
  return passwordHash;
};

export const uniqueEmail = () => `user-${randomUUID()}@example.com`;

export const createUser = async (overrides: { name?: string; email?: string } = {}) => {
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? "Test User",
      email: overrides.email ?? uniqueEmail(),
      password: await getPasswordHash(),
    },
    select: { id: true, name: true, email: true },
  });

  return { user, accessToken: signAccessToken(user.id) };
};

export const createGenre = (name: string) => prisma.genre.create({ data: { name } });

export const createMovie = (
  createdBy: string,
  overrides: {
    title?: string;
    overview?: string;
    releaseYear?: number;
    posterUrl?: string;
    genreIds?: string[];
    createdAt?: Date;
  } = {},
) =>
  prisma.movie.create({
    data: {
      title: overrides.title ?? `Movie ${randomUUID()}`,
      overview: overrides.overview,
      releaseYear: overrides.releaseYear ?? 2020,
      posterUrl: overrides.posterUrl,
      createdAt: overrides.createdAt,
      createdBy,
      movieGenres: { create: (overrides.genreIds ?? []).map((genreId) => ({ genreId })) },
    },
  });

export const createWatchlistItem = (
  userId: string,
  movieId: string,
  status: WatchlistStatus = WatchlistStatus.PLANNED,
) => prisma.watchlistItem.create({ data: { userId, movieId, status } });
