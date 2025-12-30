import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCounts } from "./api-client";
import useUser from "./use-user";

const useUnreadCounts = () => {
  const { data: user } = useUser();
  const enabled = !!user && (!user.requiresAuth || user.isAuthenticated);

  return useQuery(
    {
      queryKey: ["unread-counts"],
      queryFn: fetchUnreadCounts,
      staleTime: 300 * 1000,
      enabled: enabled,
    }
  )
};

export default useUnreadCounts;