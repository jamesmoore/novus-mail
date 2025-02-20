import { useQuery } from "@tanstack/react-query";
import { fetchDomain } from "./api-client";

const useDomain = () => useQuery(
    {
        queryKey: ["domain"],
        queryFn: fetchDomain,
        staleTime: 900 * 1000,
    }
);

export default useDomain;