import { useState } from "react";
import { Link } from "react-router";
import type { WatchlistItemWithMovie } from "../../api/types";
import { ErrorMessage } from "../../components/ErrorMessage";
import { fieldClass } from "../../components/fieldClass";
import { Poster } from "../../components/Poster";
import { StatusSelect } from "./StatusSelect";
import { useRemoveFromWatchlist, useUpdateWatchlistItem } from "./watchlistQueries";

const RATINGS = Array.from({ length: 10 }, (_, index) => index + 1);

const buttonClass =
  "rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50";

export const WatchlistItemRow = ({ item }: { item: WatchlistItemWithMovie }) => {
  const update = useUpdateWatchlistItem();
  const remove = useRemoveFromWatchlist();
  const [notes, setNotes] = useState(item.notes ?? "");

  const busy = update.isPending || remove.isPending;
  const notesChanged = notes !== (item.notes ?? "");
  const error = update.error ?? remove.error;

  const handleRemove = () => {
    const hasData = item.rating !== null || Boolean(item.notes);
    if (hasData && !window.confirm(`Remove "${item.movie.title}" and its rating and notes?`)) {
      return;
    }
    remove.mutate(item.id);
  };

  return (
    <li className="flex gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 sm:p-4">
      <Link to={`/movies/${item.movie.id}`} className="w-20 shrink-0 sm:w-24">
        <Poster url={item.movie.posterUrl} title={item.movie.title} className="rounded" />
      </Link>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <Link to={`/movies/${item.movie.id}`} className="font-medium hover:underline">
            {item.movie.title}
          </Link>
          <p className="text-xs text-neutral-400">{item.movie.releaseYear}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect
            value={item.status}
            disabled={busy}
            onChange={(status) => {
              update.mutate({ id: item.id, body: { status } });
            }}
          />
          <select
            aria-label="Rating"
            value={item.rating ?? ""}
            disabled={busy}
            onChange={(event) => {
              update.mutate({ id: item.id, body: { rating: Number(event.target.value) } });
            }}
            className={fieldClass}
          >
            {item.rating === null && (
              <option value="" disabled>
                Rate…
              </option>
            )}
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                ★ {rating}/10
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={handleRemove} className={buttonClass}>
            Remove
          </button>
        </div>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            update.mutate({ id: item.id, body: { notes } });
          }}
        >
          <textarea
            aria-label={`Notes for ${item.movie.title}`}
            placeholder="Notes…"
            rows={2}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            className={`${fieldClass} w-full resize-y`}
          />
          {notesChanged && (
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className={buttonClass}>
                Save notes
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setNotes(item.notes ?? "");
                }}
                className={buttonClass}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
        {error && <ErrorMessage error={error} />}
      </div>
    </li>
  );
};
