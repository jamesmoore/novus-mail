import { Box, CircularProgress, Divider, LinearProgress, Typography } from "@mui/material";
import FadeDelay from "./FadeDelay";
import MailboxItem from "./MailboxItem";
import { FetchNextPageOptions, InfiniteData, InfiniteQueryObserverResult } from "@tanstack/react-query";
import { MailResponse } from "./models/mail-response";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Mail } from "./models/mail";

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

    return (
        <>
            <FadeDelay isLoading={isFetching && !isFetchingNextPage && !isRefetching}>
                <Box flex="1 0 auto" display="flex" justifyContent={'center'} height={"100%"} alignItems={'center'}>
                    <CircularProgress color="primary" />
                </Box>
            </FadeDelay>

            {
                mails && mails.pages && mails.pages.map((mailPage) => {
                    return mailPage.data.map((mail) =>
                    (
                        <MailboxItem key={mail.id} mail={mail} onDelete={() => onMailItemDelete(mail)} onSelect={() => onMailItemSelect(mail)} />
                    ))
                }
                )
            }

            <Box ref={ref} mt={3} mb={3} flex="0 0 auto" display="flex" justifyContent={'center'}>

                <FadeDelay isLoading={isFetchingNextPage}>
                    <Box sx={{ width: '100%' }}><LinearProgress color="primary" /></Box>
                </FadeDelay>

                {!hasNextPage && !isFetching && <Divider component="div" sx={{ width: "100%" }}><Typography variant='body1'>No more mail</Typography></Divider>}
            </Box>
        </>
    );
}

export default MailboxItems;