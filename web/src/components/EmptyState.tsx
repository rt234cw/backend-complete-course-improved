import type { ReactNode } from "react";

export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-16 text-center">
    <p className="font-medium text-neutral-200">{title}</p>
    {children && <div className="mt-2 text-sm text-neutral-400">{children}</div>}
  </div>
);
