const APP_NAME = "Movie Watchlist";

export const PageTitle = ({ title }: { title: string }) => (
  <title>{`${title} · ${APP_NAME}`}</title>
);
