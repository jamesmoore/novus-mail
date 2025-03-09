import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useNavigate, useParams } from "react-router-dom";
import useUnreadCounts from "./useUnreadCounts";
import { useDeletedMailItems } from './useMailItems';
import MailboxItems from "./MailboxItems";

function DeletedMailbox() {
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

    async function onMailItemDelete(mail: Mail) {
        try {
            await deleteMail(mail.id);
            await refetch();
            if (!mail.read) {
                await refetchUnread();
            }
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

    return (
            <MailboxItems
                onMailItemDelete={onMailItemDelete}
                onMailItemSelect={onMailItemSelect}
                mails={mails}
                error={error}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                isFetchingNextPage={isFetchingNextPage}
                isRefetching={isRefetching}
            />
    );
}

export default DeletedMailbox;