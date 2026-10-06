import { errorMessage } from "../lib/errorMessage";

type ErrorMessageProps = {
  error: unknown;
  onRetry?: () => void;
};

export const ErrorMessage = ({ error, onRetry }: ErrorMessageProps) => (
  <div
    role="alert"
    className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
  >
    <span>{errorMessage(error)}</span>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-red-400/40 px-2 py-1 text-xs hover:bg-red-500/20"
      >
        Retry
      </button>
    )}
  </div>
);
