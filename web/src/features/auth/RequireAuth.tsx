import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Spinner } from "../../components/Spinner";
import type { RedirectState } from "./useRedirectTarget";
import { useSession } from "./session";

export const RequireAuth = () => {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) return <Spinner />;

  if (session.isError) {
    return (
      <ErrorMessage
        error={session.error}
        onRetry={() => {
          void session.refetch();
        }}
      />
    );
  }

  if (!session.data) {
    const state: RedirectState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" replace state={state} />;
  }

  return <Outlet />;
};
