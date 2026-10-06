import { Link, NavLink, Outlet, ScrollRestoration } from "react-router";
import type { User } from "../api/types";
import { useLogout, useSession } from "../features/auth/session";
import { ErrorMessage } from "./ErrorMessage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`;

type UserMenuProps = {
  user: User | null | undefined;
  isLoggingOut: boolean;
  onLogout: () => void;
};

const UserMenu = ({ user, isLoggingOut, onLogout }: UserMenuProps) => {
  if (user === undefined) return null;

  if (user === null) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="text-sm text-neutral-300 hover:text-white">
          Log in
        </Link>
        <Link
          to="/signup"
          className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-amber-300"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-neutral-400 sm:inline">{user.name}</span>
      <button
        type="button"
        disabled={isLoggingOut}
        onClick={onLogout}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50"
      >
        Log out
      </button>
    </div>
  );
};

export const Layout = () => {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Movie Watchlist home" className="font-semibold tracking-tight">
              <span aria-hidden>🎬</span>
              <span className="hidden sm:inline"> Movie Watchlist</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Movies
              </NavLink>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className={navLinkClass({ isActive: false })}
              >
                API Docs
              </a>
              {session.data && (
                <NavLink to="/watchlist" className={navLinkClass}>
                  My Watchlist
                </NavLink>
              )}
            </nav>
          </div>
          <UserMenu
            user={session.isError ? null : session.data}
            isLoggingOut={logout.isPending}
            onLogout={() => {
              logout.mutate();
            }}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {logout.isError && (
          <div className="mb-4">
            <ErrorMessage error={logout.error} />
          </div>
        )}
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
};
