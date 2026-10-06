export const Spinner = ({ label = "Loading…" }: { label?: string }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-16 text-neutral-400">
    <span className="size-5 animate-spin rounded-full border-2 border-neutral-600 border-t-amber-400" />
    <span className="text-sm">{label}</span>
  </div>
);
