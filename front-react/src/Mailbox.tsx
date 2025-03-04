import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, LinearProgress, Typography } from "@mui/material"
import MailboxItem from "./MailboxItem"
import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useNavigate, useParams } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";
import { useMailItems } from './useMailItems';
import FadeDelay from "./FadeDelay";

function Mailbox() {
    const { address: selectedAddress } = useParams();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);

    const { ref, inView } = useInView();

    const { data: addressResponse } = useAddressResponse();

    async function onMailItemSelect(mail: Mail) {
        if (!mail.read) {
            await readMail(mail.id);
            mail.read = true;
            refetchUnread();
        }
        navigate(`/mail/${selectedAddress}/${mail.id}`);
    }

    async function onMailItemDelete(itemKey: string) {
        deleteMailEvent(itemKey);
    }

    async function deleteMailEvent(itemKey: string) {
        setDeleteItemKey(itemKey);
        setDeleteConfirm(true);
    }

    const { refetch: refetchUnread } = useUnreadCounts();

    useEffect(() => {
        if (!selectedAddress) {
            const address = addressResponse?.addresses[0]?.addr;
            if (address) {
                navigate('/inbox/' + address);
            }
        }
    }, [selectedAddress, addressResponse, navigate])

    const {
        data: mails,
        error,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
        isRefetching,

    } = useMailItems(selectedAddress);

    async function deleteYes() {
        try {
            await deleteMail(deleteItemKey!);
            setDeleteConfirm(false);
            await refetch();
            await refetchUnread();
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
    }

    async function deleteNo() {
        setDeleteConfirm(false);
    }

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

export default Mailbox;