import type { WatchlistStatus } from "../api/types";

export type MovieListParams = {
  page: number;
  search?: string;
  genre?: string;
  year?: number;
  sort: "title" | "releaseYear" | "createdAt";
  order: "asc" | "desc";
};

export const queryKeys = {
  me: ["auth", "me"] as const,
  genres: ["genres"] as const,
  movies: (params: MovieListParams) => ["movies", "list", params] as const,
  movie: (id: string) => ["movies", "detail", id] as const,
  watchlist: ["watchlist"] as const,
  watchlistIds: ["watchlist", "ids"] as const,
  watchlistPage: (params: { status?: WatchlistStatus; page: number }) =>
    ["watchlist", "list", params] as const,
};
