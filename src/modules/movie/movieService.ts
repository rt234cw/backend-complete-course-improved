import type { Prisma } from "@prisma/client";
import { NotFoundError } from "../../errors/AppError.js";
import { toPaginationMeta, toSkipTake } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import type { ListMoviesQuery } from "./movieSchemas.js";
import { movieSelect, toMovie } from "./movieTypes.js";

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export const listMovies = async (query: ListMoviesQuery) => {
  const { search, genre, year, sort, order } = query;

  const where: Prisma.MovieWhereInput = {
    title: search ? { contains: escapeLikePattern(search), mode: "insensitive" } : undefined,
    releaseYear: year,
    movieGenres: genre
      ? { some: { genre: { name: { equals: genre, mode: "insensitive" } } } }
      : undefined,
  };

  const [movies, total] = await prisma.$transaction([
    prisma.movie.findMany({
      where,
      select: movieSelect,
      orderBy: [{ [sort]: order }, { id: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.movie.count({ where }),
  ]);

  return {
    movies: movies.map(toMovie),
    meta: toPaginationMeta(query, total),
  };
};

export const getMovie = async (id: string) => {
  const movie = await prisma.movie.findUnique({
    where: { id },
    select: movieSelect,
  });

  if (!movie) {
    throw new NotFoundError("Movie doesn't exist");
  }

  return toMovie(movie);
};
