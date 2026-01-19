import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreatePolicyRequest, type UpdatePolicyRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePolicies(search?: string, status?: string) {
  return useQuery({
    queryKey: [api.policies.list.path, search, status],
    queryFn: async () => {
      // Build URL with query params
      const url = new URL(api.policies.list.path, window.location.origin);
      if (search) url.searchParams.append("search", search);
      if (status) url.searchParams.append("status", status);

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch policies");
      return api.policies.list.responses[200].parse(await res.json());
    },
  });
}

export function usePolicy(id: number) {
  return useQuery({
    queryKey: [api.policies.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.policies.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch policy");
      return api.policies.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePolicyRequest) => {
      const res = await fetch(api.policies.create.path, {
        method: api.policies.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.policies.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create policy");
      }
      return api.policies.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.policies.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({
        title: "Success",
        description: "Policy added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdatePolicyRequest) => {
      const url = buildUrl(api.policies.update.path, { id });
      const res = await fetch(url, {
        method: api.policies.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to update policy");
      }
      return api.policies.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.policies.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.policies.delete.path, { id });
      const res = await fetch(url, {
        method: api.policies.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete policy");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.policies.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
