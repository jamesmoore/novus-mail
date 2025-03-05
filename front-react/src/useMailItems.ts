import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeletedMails, fetchMails } from "./api-client";
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
        return queryClient.invalidateQueries({ queryKey: queryKey });
    }

    return { invalidate };
}

const getUseDeletedMailItemsQueryKey = ['deletedmail'];

const useDeletedMailItems = () => {

    return useInfiniteQuery({
        queryKey: getUseDeletedMailItemsQueryKey,
        queryFn: async ({
            pageParam,
        }): Promise<MailResponse> => fetchDeletedMails(pageParam),
        initialPageParam: '',
        getPreviousPageParam: (firstPage) => firstPage.previousId,
        getNextPageParam: (lastPage) => lastPage.nextId,
        staleTime: 300 * 1000,
    });
}

const useInvalidateDeletedMailItemsCache = () => {
    const queryClient = useQueryClient();
    const invalidate = () => {
        const queryKey = getUseDeletedMailItemsQueryKey;
        return queryClient.invalidateQueries({ queryKey: queryKey });
    }

    return { invalidate };
}

export {
    useMailItems,
    useDeletedMailItems,
    useInvalidateMailItemsCache,
    useInvalidateDeletedMailItemsCache
};