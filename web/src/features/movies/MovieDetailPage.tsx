import { Link, useLocation, useParams } from "react-router";
import { ApiError } from "../../api/apiError";
import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { PageTitle } from "../../components/PageTitle";
import { Poster } from "../../components/Poster";
import { Spinner } from "../../components/Spinner";
import { WatchlistPanel } from "../watchlist/WatchlistPanel";
import { useMovie } from "./movieQueries";

const isNotFound = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 400);

export const MovieDetailPage = () => {
  const { id = "" } = useParams();
  const movie = useMovie(id);
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch ?? "";

  const backLink = (
    <Link to={`/${listSearch}`} className="text-sm text-neutral-400 hover:text-white">
      ← Back to movies
    </Link>
  );

  if (movie.isPending) return <Spinner label="Loading movie…" />;

  if (movie.isError) {
    return (
      <div className="space-y-4">
        {backLink}
        {isNotFound(movie.error) ? (
          <>
            <PageTitle title="Movie not found" />
            <EmptyState title="Movie not found" />
          </>
        ) : (
          <ErrorMessage
            error={movie.error}
            onRetry={() => {
              void movie.refetch();
            }}
          />
        )}
      </div>
    );
  }

  const { title, releaseYear, overview, posterUrl, genres } = movie.data;

  return (
    <div className="space-y-6">
      <PageTitle title={title} />
      {backLink}
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <Poster url={posterUrl} title={title} className="mx-auto max-w-[280px] rounded-lg" />
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="mt-1 text-neutral-400">{releaseYear}</p>
          </div>
          {genres.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <li
                  key={genre.id}
                  className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300"
                >
                  {genre.name}
                </li>
              ))}
            </ul>
          )}
          <p className="leading-relaxed text-neutral-300">{overview ?? "No overview yet."}</p>
          <WatchlistPanel movieId={movie.data.id} />
        </div>
      </div>
    </div>
  );
};
