import { z } from "zod";
import { paginationQuerySchema } from "../../schemas/commonSchemas.js";
import { genreSchema } from "../genre/genreSchemas.js";

const MIN_RELEASE_YEAR = 1888;
const MAX_RELEASE_YEAR = new Date().getFullYear() + 5;

const movieSortFields = ["title", "releaseYear", "createdAt"] as const;

const listMoviesQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .meta({ description: "Case-insensitive substring match on title", example: "horizon" }),
  genre: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .meta({ description: "Genre name, case-insensitive exact match", example: "Sci-Fi" }),
  year: z.coerce
    .number()
    .int()
    .min(MIN_RELEASE_YEAR)
    .max(MAX_RELEASE_YEAR)
    .optional()
    .meta({ description: "Release year", example: 2019 }),
  sort: z.enum(movieSortFields).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const movieSchema = z
  .strictObject({
    id: z.uuid(),
    title: z.string().meta({ example: "The Silent Horizon" }),
    overview: z.string().nullable().meta({
      example:
        "A lone astronaut drifts toward an uncharted signal at the edge of the solar system.",
    }),
    releaseYear: z.number().int().meta({ example: 2019 }),
    posterUrl: z
      .string()
      .nullable()
      .meta({ example: "https://picsum.photos/seed/silent-horizon/400/600" }),
    createdAt: z.iso.datetime(),
    genres: z.array(genreSchema).meta({ description: "Sorted by name" }),
  })
  .meta({ id: "Movie" });

type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>;

export { listMoviesQuerySchema, movieSchema };
export type { ListMoviesQuery };
