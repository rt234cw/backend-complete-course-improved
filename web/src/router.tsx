import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { NotFoundPage } from "./components/NotFoundPage";
import { RouteError } from "./components/RouteError";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { SignupPage } from "./features/auth/SignupPage";
import { MovieDetailPage } from "./features/movies/MovieDetailPage";
import { MoviesPage } from "./features/movies/MoviesPage";
import { WatchlistPage } from "./features/watchlist/WatchlistPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <MoviesPage /> },
      { path: "movies/:id", element: <MovieDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { element: <RequireAuth />, children: [{ path: "watchlist", element: <WatchlistPage /> }] },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
