import createClient, { type Client } from "openapi-fetch";
import { toApiError } from "./apiError";
import { createAuthFetch } from "./authFetch";
import type { paths } from "./schema";

export type ApiClient = Client<paths>;

export const createApiClient = ({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}): ApiClient =>
  createClient<paths>({
    baseUrl: "/api",
    fetch: createAuthFetch({ fetch: (request) => fetch(request), onSessionExpired }),
  });

export const unwrap = <T>({
  data,
  error,
  response,
}: {
  data?: T;
  error?: unknown;
  response: Response;
}): T => {
  if (!response.ok) throw toApiError(response, error);
  return data as T;
};
