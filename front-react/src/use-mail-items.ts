import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeletedMails, fetchMails } from "./api-client";
import { MailResponse } from "./models/mail-response";

const mailItemsKey0 = 'mail' as const;
const getUseMailItemsQueryKey = (address?: string) =>
  address ? [mailItemsKey0, address] as const: 
    [mailItemsKey0, "none"] as const;

const useMailItems = (selectedAddress?: string) => {
    return useInfiniteQuery({
        queryKey: getUseMailItemsQueryKey(selectedAddress),
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
        return queryClient.resetQueries({ queryKey: queryKey });
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
        return queryClient.resetQueries({ queryKey: queryKey });
    }
    return { invalidate };
}

const useInvalidateAllMailItemsCache = () => {
    const queryClient = useQueryClient();
    const invalidate = () => {
        return queryClient.resetQueries({ predicate: p => p.queryKey[0] === mailItemsKey0 });
    }
    return { invalidate };
}

export {
    useMailItems,
    useDeletedMailItems,
    useInvalidateMailItemsCache,
    useInvalidateDeletedMailItemsCache,
    useInvalidateAllMailItemsCache,
};