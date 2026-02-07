import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeletedMails, fetchMails } from "./api-client";
import { MailResponse } from "./models/mail-response";

const mailItemsKey0 = 'mail' as const;
const getUseMailItemsQueryKey = (address?: string) =>
    [mailItemsKey0, address ?? null] as const;
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

const useResetMailItemsCache = () => {
    const queryClient = useQueryClient();
    const reset = (address: string) => {
        const queryKey = getUseMailItemsQueryKey(address);
        return queryClient.resetQueries({ queryKey: queryKey });
    }

    return { reset };
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

const useResetDeletedMailItemsCache = () => {
    const queryClient = useQueryClient();
    const reset = () => {
        return queryClient.resetQueries({ queryKey: getUseDeletedMailItemsQueryKey });
    }
    return { reset };
}

const useResetAllMailItemsCache = () => {
    const queryClient = useQueryClient();
    const reset = () => {
        return queryClient.resetQueries({ predicate: p => p.queryKey[0] === mailItemsKey0 });
    }
    return { reset };
}

const useReconcileMailbox = () => {
    const queryClient = useQueryClient();

    const reconcile = (address: string) => {
        const queryKey = getUseMailItemsQueryKey(address);
        const queries = queryClient.getQueryCache().findAll({
            queryKey: queryKey,
        })

        const isActive = queries.some(q => q.getObserversCount() > 0)

        if (isActive) {
            queryClient.invalidateQueries({ queryKey: queryKey })
        } else {
            queryClient.resetQueries({ queryKey: queryKey })
        }
    }
    return { reconcile };
}


export {
    useMailItems,
    useDeletedMailItems,
    useResetMailItemsCache,
    useResetDeletedMailItemsCache,
    useResetAllMailItemsCache,
    useReconcileMailbox,
};