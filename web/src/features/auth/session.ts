import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../api/api";
import { unwrap } from "../../api/client";
import type { LoginBody, SignupBody, User } from "../../api/types";
import { clearUserData, queryClient } from "../../lib/queryClient";
import { queryKeys } from "../../lib/queryKeys";

const fetchMe = async (): Promise<User | null> => {
  const result = await api.GET("/auth/me");
  if (result.response.status === 401) return null;
  return unwrap(result).data;
};

export const useSession = () =>
  useQuery({ queryKey: queryKeys.me, queryFn: fetchMe, staleTime: Infinity });

const startSession = (user: User) => {
  clearUserData();
  queryClient.setQueryData(queryKeys.me, user);
};

export const useLogin = () =>
  useMutation({
    mutationFn: async (body: LoginBody) =>
      unwrap(await api.POST("/auth/login", { body })).data.user,
    onSuccess: startSession,
  });

export const useSignup = () =>
  useMutation({
    mutationFn: async (body: SignupBody) =>
      unwrap(await api.POST("/auth/signup", { body })).data.user,
    onSuccess: startSession,
  });

export const useLogout = () =>
  useMutation({
    mutationFn: async () => {
      unwrap(await api.POST("/auth/logout"));
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      clearUserData();
    },
  });

export const DEMO_EMAIL = "demo@example.com";

const demoPassword: unknown = import.meta.env.VITE_DEMO_PASSWORD;

export const DEMO_PASSWORD =
  typeof demoPassword === "string" && demoPassword.length > 0 ? demoPassword : undefined;
