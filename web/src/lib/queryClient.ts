import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/apiError";
import { queryKeys } from "./queryKeys";

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < MAX_RETRIES,
    },
  },
});

export const clearUserData = () => {
  queryClient.removeQueries({ queryKey: queryKeys.watchlist });
};
