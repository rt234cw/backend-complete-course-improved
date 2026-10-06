import { queryKeys } from "../lib/queryKeys";
import { clearUserData, queryClient } from "../lib/queryClient";
import { createApiClient } from "./client";

export const api = createApiClient({
  onSessionExpired: () => {
    queryClient.setQueryData(queryKeys.me, null);
    clearUserData();
  },
});
