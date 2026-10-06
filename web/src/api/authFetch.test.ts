import { describe, expect, it, vi } from "vitest";
import { createAuthFetch, type FetchFn } from "./authFetch";

const ORIGIN = "http://localhost";
const REFRESH_PATH = "/api/auth/refresh";

const unauthorized = () =>
  Response.json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } }, { status: 401 });

type FakeServerOptions = {
  refresh?: () => Promise<Response>;
  refreshSetsCookie?: boolean;
};

const createFakeServer = ({
  refresh = () => Promise.resolve(Response.json({ data: {} })),
  refreshSetsCookie = true,
}: FakeServerOptions = {}) => {
  let authenticated = false;
  const bodies: string[] = [];

  const fetch = vi.fn<FetchFn>(async (request) => {
    if (fetch.mock.calls.length > 10) throw new Error("Too many requests: refresh loop?");
    const body = await request.text();
    const { pathname } = new URL(request.url);

    if (pathname === REFRESH_PATH) {
      const response = await refresh();
      if (response.ok && refreshSetsCookie) authenticated = true;
      return response;
    }

    bodies.push(body);
    return authenticated ? Response.json({ data: "ok" }) : unauthorized();
  });

  const callsTo = (path: string) =>
    fetch.mock.calls.filter(([request]) => new URL(request.url).pathname === path).length;

  return {
    fetch,
    bodies,
    refreshCalls: () => callsTo(REFRESH_PATH),
    callsTo,
    expireAccessToken: () => {
      authenticated = false;
    },
  };
};

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const get = (path: string) => new Request(`${ORIGIN}${path}`);

const setup = (options?: FakeServerOptions) => {
  const server = createFakeServer(options);
  const onSessionExpired = vi.fn();
  const authFetch = createAuthFetch({ fetch: server.fetch, onSessionExpired });
  return { server, onSessionExpired, authFetch };
};

describe("createAuthFetch", () => {
  it.each([200, 404, 500])("passes a %i response through without refreshing", async (status) => {
    const fetch = vi.fn<FetchFn>(() => Promise.resolve(new Response(null, { status })));
    const authFetch = createAuthFetch({ fetch, onSessionExpired: vi.fn() });

    const response = await authFetch(get("/api/movies"));

    expect(response.status).toBe(status);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("refreshes on 401 and retries the original request", async () => {
    const { server, authFetch } = setup();

    const response = await authFetch(get("/api/watchlist"));

    expect(response.status).toBe(200);
    expect(server.refreshCalls()).toBe(1);
    expect(server.callsTo("/api/watchlist")).toBe(2);
  });

  it("sends the same body when retrying", async () => {
    const { server, authFetch } = setup();
    const body = JSON.stringify({ movieId: "8f0c6b8e-3a8d-4c55-9f6a-3f5c1f0b2a11" });

    const response = await authFetch(
      new Request(`${ORIGIN}/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
    );

    expect(response.status).toBe(200);
    expect(server.bodies).toEqual([body, body]);
  });

  it("shares one refresh between concurrent 401s", async () => {
    const gate = createDeferred();
    const { server, authFetch } = setup({
      refresh: async () => {
        await gate.promise;
        return Response.json({ data: {} });
      },
    });

    const pending = Promise.all([
      authFetch(get("/api/watchlist")),
      authFetch(get("/api/watchlist/ids")),
      authFetch(get("/api/auth/me")),
    ]);
    await vi.waitFor(() => {
      expect(server.bodies).toHaveLength(3);
    });
    gate.resolve();
    const responses = await pending;

    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(server.refreshCalls()).toBe(1);
  });

  it("returns the original 401 and reports the expired session once when refresh fails", async () => {
    const gate = createDeferred();
    const { server, onSessionExpired, authFetch } = setup({
      refresh: async () => {
        await gate.promise;
        return unauthorized();
      },
    });

    const pending = Promise.all([
      authFetch(get("/api/watchlist")),
      authFetch(get("/api/watchlist/ids")),
    ]);
    await vi.waitFor(() => {
      expect(server.bodies).toHaveLength(2);
    });
    gate.resolve();
    const responses = await pending;

    expect(responses.map((r) => r.status)).toEqual([401, 401]);
    await expect(Promise.all(responses.map((r) => r.json()))).resolves.toMatchObject([
      { error: { code: "UNAUTHORIZED" } },
      { error: { code: "UNAUTHORIZED" } },
    ]);
    expect(server.bodies).toHaveLength(2);
    expect(server.refreshCalls()).toBe(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("does not refresh again when the retried request is still 401", async () => {
    const { server, authFetch } = setup({ refreshSetsCookie: false });

    const response = await authFetch(get("/api/watchlist"));

    expect(response.status).toBe(401);
    expect(server.refreshCalls()).toBe(1);
    expect(server.callsTo("/api/watchlist")).toBe(2);
  });

  it.each(["/api/auth/login", "/api/auth/signup", REFRESH_PATH])(
    "returns a 401 from %s without refreshing",
    async (path) => {
      const { server, onSessionExpired, authFetch } = setup({
        refresh: () => Promise.resolve(unauthorized()),
      });

      const response = await authFetch(new Request(`${ORIGIN}${path}`, { method: "POST" }));

      expect(response.status).toBe(401);
      expect(server.fetch).toHaveBeenCalledTimes(1);
      expect(onSessionExpired).not.toHaveBeenCalled();
    },
  );

  it("starts a new refresh for a 401 after the previous refresh has finished", async () => {
    const { server, authFetch } = setup();

    await authFetch(get("/api/watchlist"));
    server.expireAccessToken();
    const response = await authFetch(get("/api/watchlist"));

    expect(response.status).toBe(200);
    expect(server.refreshCalls()).toBe(2);
  });

  it("rejects without ending the session when refresh hits a network error, and retries refresh next time", async () => {
    const networkError = new TypeError("Failed to fetch");
    const refresh = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue(Response.json({ data: {} }));
    const { onSessionExpired, authFetch } = setup({ refresh });

    await expect(authFetch(get("/api/watchlist"))).rejects.toBe(networkError);
    expect(onSessionExpired).not.toHaveBeenCalled();

    const response = await authFetch(get("/api/watchlist"));

    expect(response.status).toBe(200);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
