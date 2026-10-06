import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../api/api";
import { unwrap } from "../../api/client";
import { queryKeys, type MovieListParams } from "../../lib/queryKeys";

export const MOVIES_PAGE_SIZE = 10;

export const useMovies = (params: MovieListParams) =>
  useQuery({
    queryKey: queryKeys.movies(params),
    queryFn: async () =>
      unwrap(
        await api.GET("/movies", { params: { query: { ...params, limit: MOVIES_PAGE_SIZE } } }),
      ),
    placeholderData: keepPreviousData,
  });

export const useMovie = (id: string) =>
  useQuery({
    queryKey: queryKeys.movie(id),
    queryFn: async () => unwrap(await api.GET("/movies/{id}", { params: { path: { id } } })).data,
  });

export const useGenres = () =>
  useQuery({
    queryKey: queryKeys.genres,
    queryFn: async () => unwrap(await api.GET("/genres")).data,
    staleTime: Infinity,
  });
