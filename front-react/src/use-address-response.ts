import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAddress } from "./api-client";
import { useCallback, useMemo } from "react";

const queryKey = ["addresses"];
const useAddressResponse = () => useQuery(
    {
      queryKey: queryKey,
      queryFn: fetchAddress,
      staleTime: 900 * 1000,
    }
  )
  
const useInvalidateAddress = () => {
    const queryClient = useQueryClient();
    const invalidate = useCallback(() => {
        return queryClient.invalidateQueries({ queryKey: queryKey  });
    }, [queryClient]);
    return useMemo(() => ({ invalidate }), [invalidate]);
}

export default useAddressResponse;

export { useInvalidateAddress };