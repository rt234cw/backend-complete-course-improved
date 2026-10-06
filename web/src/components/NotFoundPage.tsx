import { Link } from "react-router";
import { EmptyState } from "./EmptyState";
import { PageTitle } from "./PageTitle";

export const NotFoundPage = () => (
  <EmptyState title="Page not found">
    <PageTitle title="Page not found" />
    <Link to="/" className="text-amber-400 hover:underline">
      Back to movies
    </Link>
  </EmptyState>
);
