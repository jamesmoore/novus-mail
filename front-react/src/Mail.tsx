import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'
import { deleteMail, fetchMail } from './api-client';
import { useQuery } from '@tanstack/react-query';
import MailboxItem from './MailboxItem';
import { useInvalidateMailItemsCache } from './useMailItems';
import LoadingSpinner from './LoadingSpinner';

function Mail() {
    const navigate = useNavigate();
    const { messageId } = useParams();

    const { data: message, isLoading: loading, error } = useQuery(
        {
            queryKey: ["mail", messageId],
            queryFn: () => messageId ? fetchMail(messageId) : undefined,
        }
    );

    const { invalidate } = useInvalidateMailItemsCache();

    async function onMailItemDelete(itemKey: string) {
        deleteMail(itemKey)
            .then(() => {
                if (message?.recipient) {
                    invalidate(message.recipient);
                }
                navigate(-1);
            })
            .catch(error => {
                console.error('Failed to delete mail ' + error);
            });
    }

    if (error) {
        return <div className="error">{error.message}</div>;
    }

    if (loading) {
        return (
            <LoadingSpinner />
        )
    }

    return (
        <>
            {message &&
                <MailboxItem mail={{
                    id: messageId!,
                    sender: message.sender,
                    sendername: message.sendername,
                    subject: message.subject,
                    read: message.read,
                    received: message.received,
                }} onDelete={onMailItemDelete} opened={true} />
            }
        </>
    );
}

export default Mail;