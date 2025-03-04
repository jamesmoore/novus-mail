import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";
import { useInvalidateDeletedMailItemsCache, useMailItems } from './useMailItems';
import MailboxItems from "./MailboxItems";
// import { useQueryClient } from "@tanstack/react-query";

function Mailbox() {
    const { address: selectedAddress } = useParams();
    const navigate = useNavigate();

    const { data: addressResponse } = useAddressResponse();

    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();

    async function onMailItemSelect(mail: Mail) {
        if (!mail.read) {
            await readMail(mail.id);
            mail.read = true;
            refetchUnread();
        }
        navigate(`/mail/${selectedAddress}/${mail.id}`);
    }

    // const queryClient = useQueryClient();

    async function onMailItemDelete(itemKey: string) {
        try {
            console.log('deleting ' + itemKey);
            await deleteMail(itemKey!);
            await useMailItemsHook.refetch();
            await refetchUnread();
            // await queryClient.invalidateQueries({ queryKey: ['deletedmail'] });
            await invalidateDeleted();
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
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

    return (
        <MailboxItems
            onMailItemDelete={onMailItemDelete}
            onMailItemSelect={onMailItemSelect}
            mails={useMailItemsHook.data}
            error={useMailItemsHook.error}
            fetchNextPage={useMailItemsHook.fetchNextPage}
            hasNextPage={useMailItemsHook.hasNextPage}
            isFetching={useMailItemsHook.isFetching}
            isFetchingNextPage={useMailItemsHook.isFetchingNextPage}
            isRefetching={useMailItemsHook.isRefetching}
        />
    );
}

export default Mailbox;