import { useSearchParams } from "react-router";
import { parsePage } from "../../lib/parsePage";
import type { MovieListParams } from "../../lib/queryKeys";

export const SORT_OPTIONS = {
  newest: { label: "Recently added", sort: "createdAt", order: "desc" },
  "title-asc": { label: "Title A–Z", sort: "title", order: "asc" },
  "title-desc": { label: "Title Z–A", sort: "title", order: "desc" },
  "year-desc": { label: "Newest release", sort: "releaseYear", order: "desc" },
  "year-asc": { label: "Oldest release", sort: "releaseYear", order: "asc" },
} as const satisfies Record<
  string,
  { label: string; sort: MovieListParams["sort"]; order: MovieListParams["order"] }
>;

export type SortKey = keyof typeof SORT_OPTIONS;

export const MIN_YEAR = 1888;
export const MAX_YEAR = new Date().getFullYear() + 5;

const isSortKey = (value: string | null): value is SortKey =>
  value !== null && Object.hasOwn(SORT_OPTIONS, value);

export const parseYear = (value: string | null): number | undefined => {
  const year = Number(value);
  return value && Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : undefined;
};

const nonEmpty = (value: string | null | undefined) => (value?.length ? value : undefined);

type FilterField = "search" | "genre" | "year" | "sort" | "page";

export const useMovieFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSort = searchParams.get("sort");
  const sortKey: SortKey = isSortKey(rawSort) ? rawSort : "newest";
  const { sort, order } = SORT_OPTIONS[sortKey];

  const params: MovieListParams = {
    page: parsePage(searchParams.get("page")),
    search: nonEmpty(searchParams.get("search")?.trim()),
    genre: nonEmpty(searchParams.get("genre")),
    year: parseYear(searchParams.get("year")),
    sort,
    order,
  };

  const update = (changes: Partial<Record<FilterField, string>>, { replace = false } = {}) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (!("page" in changes)) next.delete("page");
        return next;
      },
      { replace, preventScrollReset: !("page" in changes) },
    );
  };

  const inputs = {
    search: searchParams.get("search") ?? "",
    year: searchParams.get("year") ?? "",
  };

  return { params, inputs, sortKey, update };
};
