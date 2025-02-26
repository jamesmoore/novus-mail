import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMails } from "./api-client";
import { MailResponse } from "./models/mail-response";

const getUseMailItemsQueryKey = (selectedAddress: string) => {
    return ['mail', selectedAddress];
}

const useMailItems = (selectedAddress?: string) => {

    return useInfiniteQuery({
        queryKey: getUseMailItemsQueryKey(selectedAddress!),
        queryFn: async ({
            pageParam,
        }): Promise<MailResponse> => fetchMails(selectedAddress!, pageParam),
        initialPageParam: '',
        getPreviousPageParam: (firstPage) => firstPage.previousId,
        getNextPageParam: (lastPage) => lastPage.nextId,
        enabled: !!selectedAddress,
        staleTime: 300 * 1000,
    });
}

const useInvalidateMailItemsCache = () => {
    const queryClient = useQueryClient();

    const invalidate = (address: string) => {
        const queryKey = getUseMailItemsQueryKey(address);
        queryClient.invalidateQueries({ queryKey: queryKey });
    }

    return { invalidate };
}

export {
    useMailItems,
    useInvalidateMailItemsCache
};

