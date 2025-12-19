import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCounts } from "./api-client";

const useUnreadCounts = (enabled: boolean = true) =>  useQuery(
    {
      queryKey: ["unread-counts"],
      queryFn: fetchUnreadCounts,
      staleTime: 300 * 1000,
      enabled: enabled,
    }
  )

export default useUnreadCounts;