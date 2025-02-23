import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMails } from "./api-client";
import { MailResponse } from "./models/mail-response";
import { useMemo } from "react";

const useMailItems = (selectedAddress?: string) => {
    
    const queryKey = useMemo(() => ['mail', selectedAddress], [selectedAddress]);

    return useInfiniteQuery({
        queryKey: queryKey,
        queryFn: async ({
            pageParam,
        }): Promise<MailResponse> => fetchMails(selectedAddress!, pageParam),
        initialPageParam: '',
        getPreviousPageParam: (firstPage) => firstPage.previousId,
        getNextPageParam: (lastPage) => lastPage.nextId,
        enabled: !!selectedAddress,
    });

}

export default useMailItems;