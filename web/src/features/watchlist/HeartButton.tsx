import { useLocation, useNavigate } from "react-router";
import { errorMessage } from "../../lib/errorMessage";
import { useSession } from "../auth/session";
import type { RedirectState } from "../auth/useRedirectTarget";
import { useAddToWatchlist, useRemoveFromWatchlist, useWatchlistIds } from "./watchlistQueries";

type HeartButtonProps = {
  movieId: string;
  title: string;
};

export const HeartButton = ({ movieId, title }: HeartButtonProps) => {
  const session = useSession();
  const ids = useWatchlistIds();
  const add = useAddToWatchlist();
  const remove = useRemoveFromWatchlist();
  const navigate = useNavigate();
  const location = useLocation();

  const item = ids.data?.get(movieId);
  const saved = Boolean(item);
  const busy = add.isPending || remove.isPending || (Boolean(session.data) && ids.isPending);
  const error = add.error ?? remove.error;
  const label = saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`;

  const handleClick = () => {
    if (!session.data) {
      const state: RedirectState = { from: `${location.pathname}${location.search}` };
      void navigate("/login", { state });
      return;
    }
    if (item) remove.mutate(item.id);
    else add.mutate(movieId);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label={label}
        aria-pressed={saved}
        title={label}
        disabled={busy}
        onClick={handleClick}
        className="grid size-9 place-items-center rounded-full bg-neutral-950/70 text-lg backdrop-blur transition hover:scale-110 disabled:opacity-60"
      >
        <span aria-hidden className={saved ? "text-rose-500" : "text-neutral-300"}>
          {saved ? "♥" : "♡"}
        </span>
      </button>
      {error && (
        <p
          role="alert"
          className="max-w-36 rounded-md bg-red-950/90 px-2 py-1 text-right text-xs text-red-200"
        >
          {errorMessage(error)}
        </p>
      )}
    </div>
  );
};
