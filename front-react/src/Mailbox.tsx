import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";
import { useMailItems } from './useMailItems';
import MailboxItems from "./MailboxItems";

function Mailbox() {
    const { address: selectedAddress } = useParams();
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);

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

    const useMailItemsHook = useMailItems(selectedAddress);

    async function deleteYes() {
        try {
            await deleteMail(deleteItemKey!);
            setDeleteConfirm(false);
            await useMailItemsHook.refetch();
            await refetchUnread();
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
    }

    async function deleteNo() {
        setDeleteConfirm(false);
    }

    return (
        <>
            <MailboxItems
                onMailItemDelete={onMailItemDelete}
                onMailItemSelect={onMailItemSelect}
                useMailItems={useMailItemsHook}
            />

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