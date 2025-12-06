import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "./api-client";

const useUser = () => useQuery(
    {
        queryKey: ["user"],
        queryFn: fetchUser,
    }
);

export default useUser;