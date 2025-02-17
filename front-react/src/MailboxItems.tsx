import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Typography } from "@mui/material"
import MailboxItem from "./MailboxItem"
import { InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { MailResponse } from "./models/mail-response";
import { deleteMail, fetchMails, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useContext, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import AddressContext from "./AddressContext";

interface MailboxItemsProps {
    refreshInterval?: number;
    onRefreshUnread?: () => void;
}

function MailBoxItems({ refreshInterval, onRefreshUnread }: MailboxItemsProps) {
    const { selectedAddress } = useContext(AddressContext);

    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);

    const { ref, inView } = useInView();

    const queryClient = useQueryClient();

    const queryKey = useMemo(() => ['mail', selectedAddress], [selectedAddress]);

    async function onMailItemSelect(mail: Mail) {
        await readMail(mail.id);
        mail.read = true;
        navigate('/mail/' + mail.id);
    }

    async function onMailItemDelete(itemKey: string) {
        deleteMailEvent(itemKey);
    }

    async function deleteMailEvent(itemKey: string) {
        setDeleteItemKey(itemKey);
        setDeleteConfirm(true);
    }
    const {
        data: mails,
        error,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: queryKey,
        queryFn: async ({
            pageParam,
        }): Promise<MailResponse> => fetchMails(selectedAddress, pageParam),
        initialPageParam: '',
        getPreviousPageParam: (firstPage) => firstPage.previousId,
        getNextPageParam: (lastPage) => lastPage.nextId,
        enabled: !!selectedAddress,
    });

    async function deleteYes() {
        try {
            await deleteMail(deleteItemKey!);
            setDeleteConfirm(false);

            const newPagesArray =
                mails?.pages.map((page) =>
                ({
                    data: page.data.filter((mail) => mail.id !== deleteItemKey),
                    previousId: page.previousId,
                    nextId: page.nextId
                } as MailResponse)
                ) ?? [];

            queryClient.setQueryData(queryKey, (data: InfiniteData<MailResponse, string[]>) =>
            (
                {
                    pages: newPagesArray,
                    pageParams: data.pageParams,
                }
            )
            );

            await onRefreshUnread;
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
    }

    async function deleteNo() {
        setDeleteConfirm(false);
    }


    useEffect(() => {

        const newMailCheck = () => {
            if (mails && mails.pages.length > 0 && mails.pages[0].previousId) {
                const previousId = mails.pages[0].previousId;
                fetchMails(selectedAddress, previousId).then(
                    (p) => {
                        if (p.data.length > 0) {
                            refetch();
                        }
                    }
                );
            }
        };

        if (refreshInterval) {
            const interval = setInterval(newMailCheck, refreshInterval * 1000);
            return () => {
                clearInterval(interval);
            };
        }
    }, [refreshInterval, selectedAddress, mails, refetch]);

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
            {isFetching && !isRefetching && (<>Loading...</>)}
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
                {isFetching && !isFetchingNextPage && <CircularProgress color="primary" />}
                {isFetchingNextPage && <CircularProgress />}
                {!hasNextPage && !isFetching && <Divider component="div" sx={{ width: "100%" }}><Typography variant='body1'>No more mail</Typography></Divider>}
            </Box>


            <Dialog
                open={deleteConfirm}
                onClose={deleteNo}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirm
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        delete?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={deleteNo}>No</Button>
                    <Button onClick={deleteYes} autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
}

export default MailBoxItems;