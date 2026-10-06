import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { ErrorMessage } from "../../components/ErrorMessage";
import { TextField } from "../../components/TextField";
import { AuthCard } from "./AuthCard";
import { fieldErrorsFrom } from "./fieldErrors";
import { DEMO_EMAIL, DEMO_PASSWORD, useLogin, useSession } from "./session";
import { useRedirectTarget } from "./useRedirectTarget";

const FIELDS = ["email", "password"] as const;

export const LoginPage = () => {
  const session = useSession();
  const login = useLogin();
  const location = useLocation();
  const redirectTo = useRedirectTarget();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (session.data) return <Navigate to={redirectTo} replace />;

  const submit = (credentials: { email: string; password: string }) => {
    login.mutate(credentials);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({ email, password });
  };

  const demoPassword = DEMO_PASSWORD;
  const fieldErrors = fieldErrorsFrom(login.error, FIELDS);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          error={fieldErrors.password}
        />
        {login.isError && !hasFieldErrors && <ErrorMessage error={login.error} />}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-md bg-amber-400 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      {demoPassword && (
        <button
          type="button"
          disabled={login.isPending}
          onClick={() => {
            submit({ email: DEMO_EMAIL, password: demoPassword });
          }}
          className="mt-3 w-full rounded-md border border-neutral-700 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          Try the demo
        </button>
      )}
      <p className="mt-6 text-center text-sm text-neutral-400">
        No account?{" "}
        <Link
          to="/signup"
          state={location.state as unknown}
          className="text-amber-400 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
};
