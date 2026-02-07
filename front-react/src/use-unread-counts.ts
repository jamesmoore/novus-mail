import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUnreadCounts } from "./api-client";
import useUser from "./use-user";

const queryKey = ["unread-counts"];

const useUnreadCounts = () => {
  const { data: user } = useUser();
  const enabled = !!user && (!user.requiresAuth || user.isAuthenticated);

  return useQuery(
    {
      queryKey: queryKey,
      queryFn: fetchUnreadCounts,
      staleTime: 300 * 1000,
      enabled: enabled,
    }
  )
};

const useInvalidateUnreadCounts = () => {
    const queryClient = useQueryClient();
    const invalidate = () => {
        return queryClient.invalidateQueries({ queryKey: queryKey  });
    }
    return { invalidate };
}

export default useUnreadCounts;

export { useInvalidateUnreadCounts };