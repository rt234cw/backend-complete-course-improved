import type { WatchlistStatus } from "../../api/types";

export const WATCHLIST_STATUSES = [
  "PLANNED",
  "WATCHING",
  "COMPLETED",
  "DROPPED",
] as const satisfies readonly WatchlistStatus[];

export const STATUS_LABELS: Record<WatchlistStatus, string> = {
  PLANNED: "Planned",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const isWatchlistStatus = (value: string | null): value is WatchlistStatus =>
  WATCHLIST_STATUSES.some((status) => status === value);
