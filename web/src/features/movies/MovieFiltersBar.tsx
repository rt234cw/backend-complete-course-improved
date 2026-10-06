import { fieldClass } from "../../components/fieldClass";
import { useGenres } from "./movieQueries";
import {
  MAX_YEAR,
  MIN_YEAR,
  SORT_OPTIONS,
  parseYear,
  useMovieFilters,
  type SortKey,
} from "./movieFilters";

export const MovieFiltersBar = () => {
  const { params, inputs, sortKey, update } = useMovieFilters();
  const genres = useGenres();
  const yearIsValid = inputs.year === "" || parseYear(inputs.year) !== undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
      <input
        type="search"
        placeholder="Search by title…"
        aria-label="Search by title"
        maxLength={100}
        value={inputs.search}
        onChange={(event) => {
          update({ search: event.target.value }, { replace: true });
        }}
        className={fieldClass}
      />
      <select
        aria-label="Genre"
        value={params.genre ?? ""}
        onChange={(event) => {
          update({ genre: event.target.value });
        }}
        className={fieldClass}
      >
        <option value="">All genres</option>
        {genres.data?.map((genre) => (
          <option key={genre.id} value={genre.name}>
            {genre.name}
          </option>
        ))}
      </select>
      <div>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Year"
          aria-label="Release year"
          aria-invalid={!yearIsValid}
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={inputs.year}
          onChange={(event) => {
            update({ year: event.target.value }, { replace: true });
          }}
          className={`${fieldClass} w-full aria-invalid:border-red-500 lg:w-28`}
        />
        {!yearIsValid && (
          <p className="mt-1 text-xs text-red-300">
            Enter a year between {MIN_YEAR} and {MAX_YEAR}
          </p>
        )}
      </div>
      <select
        aria-label="Sort"
        value={sortKey}
        onChange={(event) => {
          update({ sort: event.target.value === "newest" ? "" : event.target.value });
        }}
        className={fieldClass}
      >
        {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {SORT_OPTIONS[key].label}
          </option>
        ))}
      </select>
    </div>
  );
};
