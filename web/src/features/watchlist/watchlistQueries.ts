import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../api/api";
import { unwrap } from "../../api/client";
import type { UpdateWatchlistItemBody, WatchlistId, WatchlistStatus } from "../../api/types";
import { queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";
import { useSession } from "../auth/session";

export const WATCHLIST_PAGE_SIZE = 10;

export const useWatchlistIds = () => {
  const session = useSession();

  return useQuery({
    queryKey: queryKeys.watchlistIds,
    queryFn: async () => unwrap(await api.GET("/watchlist/ids")).data,
    enabled: Boolean(session.data),
    select: (items) => new Map<string, WatchlistId>(items.map((item) => [item.movieId, item])),
  });
};

export const useWatchlistPage = (params: { status?: WatchlistStatus; page: number }) =>
  useQuery({
    queryKey: queryKeys.watchlistPage(params),
    queryFn: async () =>
      unwrap(
        await api.GET("/watchlist", {
          params: { query: { ...params, limit: WATCHLIST_PAGE_SIZE } },
        }),
      ),
    placeholderData: keepPreviousData,
  });

const invalidateWatchlist = () => queryClient.invalidateQueries({ queryKey: queryKeys.watchlist });

export const useAddToWatchlist = () =>
  useMutation({
    mutationFn: async (movieId: string) =>
      unwrap(await api.POST("/watchlist", { body: { movieId } })).data,
    onSettled: invalidateWatchlist,
  });

export const useUpdateWatchlistItem = () =>
  useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateWatchlistItemBody }) =>
      unwrap(await api.PATCH("/watchlist/{id}", { params: { path: { id } }, body })).data,
    onSettled: invalidateWatchlist,
  });

export const useRemoveFromWatchlist = () =>
  useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE("/watchlist/{id}", { params: { path: { id } } }));
    },
    onSettled: invalidateWatchlist,
  });
