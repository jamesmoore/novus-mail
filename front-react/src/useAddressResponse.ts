import { useQuery } from "@tanstack/react-query";
import { fetchAddress } from "./api-client";

const useAddressResponse = () => useQuery(
    {
      queryKey: ["addresses"],
      queryFn: fetchAddress,
      staleTime: 5 * 1000,
    }
  )

export default useAddressResponse;