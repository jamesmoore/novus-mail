import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCounts } from "./api-client";

const useUnreadCounts = () =>  useQuery(
    {
      queryKey: ["unread-counts"],
      queryFn: fetchUnreadCounts,
      refetchInterval: 10000,
    }
  )

export default useUnreadCounts;