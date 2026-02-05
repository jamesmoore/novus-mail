import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAddress } from "./api-client";

const addressesQueryKey = ["addresses"];

const useAddressResponse = () => useQuery(
    {
      queryKey: addressesQueryKey,
      queryFn: fetchAddress,
      staleTime: 900 * 1000,
    }
  )

export const useInvalidateAddressCache = () => {
    const queryClient = useQueryClient();
    const invalidate = () => {
        return queryClient.resetQueries({ queryKey: addressesQueryKey });
    }
    return { invalidate };
}

export default useAddressResponse;