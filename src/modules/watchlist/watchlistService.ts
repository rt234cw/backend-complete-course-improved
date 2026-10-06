import { WatchlistStatus, type Prisma } from "@prisma/client";
import { NotFoundError } from "../../errors/AppError.js";
import { toPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { movieSelect, toMovie } from "../movie/movieTypes.js";
import type {
  AddToWatchlistInput,
  ListWatchlistQuery,
  PatchWatchlistItemInput,
} from "./watchlistSchemas.js";

export const listWatchlist = async (userId: string, query: ListWatchlistQuery) => {
  const where: Prisma.WatchlistItemWhereInput = { userId, status: query.status };

  const [items, total] = await prisma.$transaction([
    prisma.watchlistItem.findMany({
      where,
      include: { movie: { select: movieSelect } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.watchlistItem.count({ where }),
  ]);

  return {
    items: items.map(({ movie, ...item }) => ({ ...item, movie: toMovie(movie) })),
    meta: toPaginationMeta(query, total),
  };
};

export const listWatchlistIds = (userId: string) =>
  prisma.watchlistItem.findMany({
    where: { userId },
    select: { id: true, movieId: true, status: true },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

export const addToWatchlist = async (userId: string, input: AddToWatchlistInput) => {
  const { movieId, status, rating, notes } = input;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { id: true },
  });

  if (!movie) {
    throw new NotFoundError("Movie doesn't exist");
  }

  return prisma.watchlistItem.create({
    data: {
      userId,
      movieId,
      status: status ?? WatchlistStatus.PLANNED,
      rating,
      notes,
    },
  });
};

export const removeFromWatchlist = async (userId: string, id: string) => {
  await prisma.watchlistItem.delete({
    where: { id, userId },
  });
};

export const updateWatchlistItem = (userId: string, id: string, input: PatchWatchlistItemInput) => {
  return prisma.watchlistItem.update({
    where: { id, userId },
    data: input,
  });
};
