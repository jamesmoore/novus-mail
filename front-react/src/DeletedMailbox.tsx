import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useNavigate, useParams } from "react-router-dom";
import useUnreadCounts from "./useUnreadCounts";
import { useDeletedMailItems } from './useMailItems';
// import MailboxItems from "./MailboxItems";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import FadeDelay from "./FadeDelay";
import { Box, CircularProgress, Divider, LinearProgress, Typography } from "@mui/material";
import MailboxItem from "./MailboxItem";

function Mailbox() {
    const { address: selectedAddress } = useParams();
    const navigate = useNavigate();

    async function onMailItemSelect(mail: Mail) {
        if (!mail.read) {
            await readMail(mail.id);
            mail.read = true;
            refetchUnread();
        }
        navigate(`/mail/${selectedAddress}/${mail.id}`);
    }

    async function onMailItemDelete(itemKey: string) {
        try {
            await deleteMail(itemKey!);
            await refetch();
            await refetchUnread();
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
    }

    const { refetch: refetchUnread } = useUnreadCounts();

    const { 
        fetchNextPage,
        error,
        refetch,
        isFetching,
        isFetchingNextPage,
        isRefetching,
        data: mails,
        hasNextPage,
    } = useDeletedMailItems();

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
                        <MailboxItem key={mail.id} mail={mail} onDelete={onMailItemDelete} onSelect={() => onMailItemSelect(mail)} />
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

export default Mailbox;