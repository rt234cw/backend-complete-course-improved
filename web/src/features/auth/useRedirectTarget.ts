import { useLocation } from "react-router";

export type RedirectState = { from?: string } | null;

export const useRedirectTarget = (): string => {
  const state = useLocation().state as RedirectState;
  const from = state?.from;
  return from?.startsWith("/") && !from.startsWith("//") ? from : "/";
};
