import { EmptyState } from "../../components/EmptyState";
import { ErrorMessage } from "../../components/ErrorMessage";
import { PageTitle } from "../../components/PageTitle";
import { Pagination } from "../../components/Pagination";
import { Spinner } from "../../components/Spinner";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { MovieCard } from "./MovieCard";
import { MovieFiltersBar } from "./MovieFiltersBar";
import { useMovieFilters } from "./movieFilters";
import { useMovies } from "./movieQueries";

const TYPING_DEBOUNCE_MS = 300;

export const MoviesPage = () => {
  const { params, update } = useMovieFilters();
  const search = useDebouncedValue(params.search, TYPING_DEBOUNCE_MS);
  const year = useDebouncedValue(params.year, TYPING_DEBOUNCE_MS);
  const movies = useMovies({ ...params, search, year });

  const hasFilters = [params.search, params.genre, params.year].some(
    (value) => value !== undefined,
  );

  const renderResults = () => {
    if (movies.isPending) return <Spinner label="Loading movies…" />;

    if (movies.isError) {
      return (
        <ErrorMessage
          error={movies.error}
          onRetry={() => {
            void movies.refetch();
          }}
        />
      );
    }

    const { data, meta } = movies.data;

    if (data.length === 0) {
      if (meta.total > 0) {
        return (
          <EmptyState title="This page is empty">
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                update({ page: "" });
              }}
            >
              Go to the first page
            </button>
          </EmptyState>
        );
      }
      return (
        <EmptyState title="No movies found">
          {hasFilters && (
            <button
              type="button"
              className="text-amber-400 hover:underline"
              onClick={() => {
                update({ search: "", genre: "", year: "" });
              }}
            >
              Clear filters
            </button>
          )}
        </EmptyState>
      );
    }

    return (
      <div
        className={`space-y-6 transition-opacity ${movies.isPlaceholderData ? "opacity-60" : ""}`}
      >
        <p className="text-sm text-neutral-400">
          {meta.total} {meta.total === 1 ? "movie" : "movies"}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={(page) => {
            update({ page: page === 1 ? "" : String(page) });
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Movies" />
      <h1 className="text-2xl font-semibold">Movies</h1>
      <MovieFiltersBar />
      {renderResults()}
    </div>
  );
};
