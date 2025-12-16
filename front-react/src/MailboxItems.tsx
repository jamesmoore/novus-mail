import MailboxItem from "./MailboxItem";
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from "@tanstack/react-query";
import { MailResponse } from "./models/mail-response";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Mail } from "./models/mail";
import LoadingSpinner from "./LoadingSpinner";

interface MailboxItemsProps {
    onMailItemSelect: (mail: Mail) => void;
    onMailItemDelete: (mail: Mail) => void;
    mails: InfiniteData<MailResponse, unknown> | undefined,
    error: Error | null,
    isFetching: boolean,
    isFetchingNextPage: boolean,
    fetchNextPage: (options?: FetchNextPageOptions) => Promise<InfiniteQueryObserverResult<InfiniteData<MailResponse, unknown>, Error>>
    hasNextPage: boolean,
    isRefetching: boolean,
}

function MailboxItems({
    onMailItemSelect,
    onMailItemDelete,
    mails,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isRefetching,
}: MailboxItemsProps) {

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView) {
            fetchNextPage()
        }
    }, [fetchNextPage, inView])

    if (error) {
        return <div className="error">{error.message}</div>;
    }

    const showSpinner = isFetching && !isFetchingNextPage && !isRefetching;

    if (showSpinner) {
        return (
            <LoadingSpinner />
        )
    }
    else {
        return (
            <>
                {
                    mails && mails.pages && mails.pages.map((mailPage) => {
                        return mailPage.data.map((mail) =>
                        (
                            <MailboxItem
                                key={mail.id}
                                mail={mail}
                                onDelete={() => onMailItemDelete(mail)}
                                onSelect={() => onMailItemSelect(mail)}
                                opened={false} />
                        ))
                    }
                    )
                }

                <div ref={ref} className="flex mt-1 mb-1 flex-0 justify-center">

                    {isFetchingNextPage && <LoadingSpinner />}
                    {!hasNextPage && !isFetching &&
                        <div className="divider" >
                            <span className="divider-wrapper">
                                <p className="text-neutral-600">
                                    No more mail
                                </p>
                            </span>
                        </div>}
                </div>
            </>
        );
    }
}

export default MailboxItems;