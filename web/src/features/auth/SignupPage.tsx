import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { ErrorMessage } from "../../components/ErrorMessage";
import { TextField } from "../../components/TextField";
import { AuthCard } from "./AuthCard";
import { fieldErrorsFrom } from "./fieldErrors";
import { useSession, useSignup } from "./session";
import { useRedirectTarget } from "./useRedirectTarget";

const FIELDS = ["name", "email", "password"] as const;

export const SignupPage = () => {
  const session = useSession();
  const signup = useSignup();
  const location = useLocation();
  const redirectTo = useRedirectTarget();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (session.data) return <Navigate to={redirectTo} replace />;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    signup.mutate({ name, email, password });
  };

  const fieldErrors = fieldErrorsFrom(signup.error, FIELDS);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return (
    <AuthCard title="Create an account">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Name"
          autoComplete="name"
          required
          maxLength={50}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          error={fieldErrors.password}
        />
        <p className="text-xs text-neutral-500">At least 8 characters.</p>
        {signup.isError && !hasFieldErrors && <ErrorMessage error={signup.error} />}
        <button
          type="submit"
          disabled={signup.isPending}
          className="w-full rounded-md bg-amber-400 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {signup.isPending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">
        Already have an account?{" "}
        <Link
          to="/login"
          state={location.state as unknown}
          className="text-amber-400 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
};
