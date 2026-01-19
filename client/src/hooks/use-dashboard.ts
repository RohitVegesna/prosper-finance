import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: [api.dashboard.analytics.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.analytics.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard analytics");
      return api.dashboard.analytics.responses[200].parse(await res.json());
    },
  });
}
