import { PageTitle } from "./PageTitle";

export const RouteError = () => (
  <div className="min-h-screen bg-neutral-950 p-6 text-neutral-100">
    <PageTitle title="Something went wrong" />
    <div role="alert" className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-400">
        An unexpected error occurred. Reloading the page usually fixes it.
      </p>
      <button
        type="button"
        onClick={() => {
          window.location.reload();
        }}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
      >
        Reload
      </button>
    </div>
  </div>
);
