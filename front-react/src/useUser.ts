import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "./api-client";

const useUser = () => useQuery(
    {
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
    }
);

export default useUser;