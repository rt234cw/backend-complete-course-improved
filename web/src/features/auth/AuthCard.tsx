import type { ReactNode } from "react";
import { PageTitle } from "../../components/PageTitle";

export const AuthCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mx-auto mt-8 w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
    <PageTitle title={title} />
    <h1 className="mb-6 text-xl font-semibold">{title}</h1>
    {children}
  </div>
);
