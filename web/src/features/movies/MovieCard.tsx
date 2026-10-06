import { Link, useLocation } from "react-router";
import type { Movie } from "../../api/types";
import { Poster } from "../../components/Poster";
import { HeartButton } from "../watchlist/HeartButton";

export const MovieCard = ({ movie }: { movie: Movie }) => {
  const { search } = useLocation();

  return (
    <article className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      <Link
        to={`/movies/${movie.id}`}
        state={{ listSearch: search }}
        className="block focus-visible:-outline-offset-2"
      >
        <Poster
          url={movie.posterUrl}
          title={movie.title}
          className="transition group-hover:opacity-90"
        />
        <div className="space-y-1 p-3">
          <h2 className="line-clamp-1 font-medium">{movie.title}</h2>
          <p className="text-xs text-neutral-400">
            {movie.releaseYear}
            {movie.genres.length > 0 && ` · ${movie.genres.map((genre) => genre.name).join(", ")}`}
          </p>
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <HeartButton movieId={movie.id} title={movie.title} />
      </div>
    </article>
  );
};
