import type { Prisma } from "@prisma/client";
import { genreSelect } from "../genre/genreTypes.js";

export const movieSelect = {
  id: true,
  title: true,
  overview: true,
  releaseYear: true,
  posterUrl: true,
  createdAt: true,
  movieGenres: {
    select: { genre: { select: genreSelect } },
    orderBy: { genre: { name: "asc" } },
  },
} satisfies Prisma.MovieSelect;

type MovieRecord = Prisma.MovieGetPayload<{ select: typeof movieSelect }>;

export const toMovie = ({ movieGenres, ...movie }: MovieRecord) => ({
  ...movie,
  genres: movieGenres.map(({ genre }) => genre),
});

export type Movie = ReturnType<typeof toMovie>;
