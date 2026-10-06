import { Link, useSearchParams } from "react-router";
import type { WatchlistStatus } from "../../api/types";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { PageTitle } from "../../components/PageTitle";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { parsePage } from "../../lib/parsePage";
import { STATUS_LABELS, WATCHLIST_STATUSES, isWatchlistStatus } from "./statuses";
import { WatchlistItemRow } from "./WatchlistItemRow";
import { useWatchlistPage } from "./watchlistQueries";

const FILTERS: { status?: WatchlistStatus; label: string }[] = [
  { label: "All" },
  ...WATCHLIST_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status] })),
];

const searchFor = ({ status, page }: { status?: WatchlistStatus; page?: number }) => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const WatchlistPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = isWatchlistStatus(rawStatus) ? rawStatus : undefined;
  const page = parsePage(searchParams.get("page"));
  const watchlist = useWatchlistPage({ status, page });

  const goTo = (next: { status?: WatchlistStatus; page?: number }) => {
    setSearchParams(searchFor(next));
  };

  const renderItems = () => {
    if (watchlist.isPending) return <Spinner label="Loading your watchlist…" />;

    if (watchlist.isError) {
      return (
        <ErrorMessage
          error={watchlist.error}
          onRetry={() => {
            void watchlist.refetch();
          }}
        />
      );
    }

    const { data, meta } = watchlist.data;

    if (data.length === 0) {
      if (meta.total > 0) {
        return (
          <EmptyState title="This page is empty">
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                goTo({ status });
              }}
            >
              Go to the first page
            </button>
          </EmptyState>
        );
      }
      return (
        <EmptyState
          title={status ? `Nothing marked as ${STATUS_LABELS[status]}` : "Your watchlist is empty"}
        >
          <Link to="/" className="text-amber-400 hover:underline">
            Browse movies
          </Link>
        </EmptyState>
      );
    }

    return (
      <div
        className={`space-y-6 transition-opacity ${watchlist.isPlaceholderData ? "opacity-60" : ""}`}
      >
        <ul className="space-y-3">
          {data.map((item) => (
            <WatchlistItemRow key={item.id} item={item} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(nextPage) => {
            goTo({ status, page: nextPage });
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageTitle title="My Watchlist" />
      <h1 className="text-2xl font-semibold">My Watchlist</h1>
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const selected = filter.status === status;
          return (
            <Link
              key={filter.label}
              to={{ search: searchFor({ status: filter.status }) }}
              preventScrollReset
              aria-current={selected ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm ${selected ? "bg-amber-400 font-medium text-neutral-950" : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>
      {renderItems()}
    </div>
  );
};
