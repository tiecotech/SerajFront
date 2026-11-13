"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError, get, post } from "./api";
import type { User } from "./types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await get<{ data: User }>("/auth/me")).data;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function homeFor(user: User): string {
  if (user.role === "admin") return "/app/admin";
  if (user.role === "warehouse") return "/app/warehouse";
  return "/app/catalog";
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    try {
      await post("/auth/logout");
    } finally {
      qc.clear();
      router.replace("/login");
    }
  };
}
