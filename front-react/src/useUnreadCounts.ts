import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCounts } from "./api-client";

const useUnreadCounts = () =>  useQuery(
    {
      queryKey: ["unread-counts"],
      queryFn: fetchUnreadCounts,
      staleTime: 300 * 1000,
    }
  )

export default useUnreadCounts;