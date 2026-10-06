import { ApiError } from "../api/apiError";

const formatWait = (seconds: number) => {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
};

export const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 429 && error.retryAfterSeconds) {
      return `Too many requests. Try again in ${formatWait(error.retryAfterSeconds)}.`;
    }
    if (error.status >= 500) return "Something went wrong on our side. Please try again.";
    return error.message;
  }
  return "Could not reach the server. Check your connection and try again.";
};
