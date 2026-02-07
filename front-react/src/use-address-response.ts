import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAddress } from "./api-client";

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
    const invalidate = () => {
        return queryClient.invalidateQueries({ queryKey: queryKey  });
    }
    return { invalidate };
}

export default useAddressResponse;

export { useInvalidateAddress };