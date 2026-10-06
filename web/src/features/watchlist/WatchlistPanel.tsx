import { Link, useLocation } from "react-router";
import { ErrorMessage } from "../../components/ErrorMessage";
import { useSession } from "../auth/session";
import type { RedirectState } from "../auth/useRedirectTarget";
import { StatusSelect } from "./StatusSelect";
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistItem,
  useWatchlistIds,
} from "./watchlistQueries";

export const WatchlistPanel = ({ movieId }: { movieId: string }) => {
  const session = useSession();
  const ids = useWatchlistIds();
  const add = useAddToWatchlist();
  const update = useUpdateWatchlistItem();
  const remove = useRemoveFromWatchlist();
  const location = useLocation();

  if (session.isPending) return null;

  if (!session.data) {
    const state: RedirectState = { from: location.pathname };
    return (
      <p className="text-sm text-neutral-400">
        <Link to="/login" state={state} className="text-amber-400 hover:underline">
          Log in
        </Link>{" "}
        to add this movie to your watchlist.
      </p>
    );
  }

  if (ids.isPending) return null;
  if (ids.isError) return <ErrorMessage error={ids.error} />;

  const item = ids.data.get(movieId);
  const busy = add.isPending || update.isPending || remove.isPending;
  const error = add.error ?? update.error ?? remove.error;

  return (
    <div className="space-y-3">
      {item ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-400">In your watchlist:</span>
          <StatusSelect
            value={item.status}
            disabled={busy}
            onChange={(status) => {
              update.mutate({ id: item.id, body: { status } });
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              remove.mutate(item.id);
            }}
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            Remove
          </button>
          <Link to="/watchlist" className="text-sm text-amber-400 hover:underline">
            Rate &amp; add notes
          </Link>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            add.mutate(movieId);
          }}
          className="rounded-md bg-amber-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
        >
          ♡ Add to watchlist
        </button>
      )}
      {error && <ErrorMessage error={error} />}
    </div>
  );
};
