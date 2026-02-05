import { deleteMail, readMail } from "./api-client";
import { Mail } from "./models/mail";
import { useParams } from "react-router-dom";
import { useMailItems } from './use-mail-items';
import MailboxItems from "./mailbox-items";

function Mailbox() {
    const { address: selectedAddress } = useParams();

    async function onMailItemSelect(mail: Mail) {
        if (!mail.read) {
            await readMail(mail.id);
            mail.read = true;
        }
    }

    async function onMailItemDelete(mail: Mail) {
        try {
            await deleteMail(mail.id);
        }
        catch (error) {
            console.error('Failed to delete mail ' + error);
        };
    }

    const {
        fetchNextPage,
        error,
        isFetching,
        isFetchingNextPage,
        isRefetching,
        data: mails,
        hasNextPage } = useMailItems(selectedAddress);

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

export default Mailbox;