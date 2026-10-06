export type FetchFn = (request: Request) => Promise<Response>;

export type AuthFetchOptions = {
  fetch: FetchFn;
  onSessionExpired: () => void;
};

const REFRESH_PATH = "/api/auth/refresh";
const NO_REFRESH_PATHS = new Set(["/api/auth/login", "/api/auth/signup", REFRESH_PATH]);

export const createAuthFetch = ({ fetch, onSessionExpired }: AuthFetchOptions): FetchFn => {
  let refreshing: Promise<boolean> | null = null;

  const refresh = async (url: string): Promise<boolean> => {
    const response = await fetch(new Request(new URL(REFRESH_PATH, url), { method: "POST" }));
    if (!response.ok) onSessionExpired();
    return response.ok;
  };

  const refreshOnce = (url: string) => {
    refreshing ??= refresh(url).finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  return async (request) => {
    const retry = request.clone();
    const response = await fetch(request);

    if (response.status !== 401 || NO_REFRESH_PATHS.has(new URL(request.url).pathname)) {
      return response;
    }

    return (await refreshOnce(request.url)) ? fetch(retry) : response;
  };
};
