import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'
import { deleteMail, fetchMail } from './api-client';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import MailboxItem from './MailboxItem';
import { useInvalidateMailItemsCache } from './useMailItems';
import FadeDelay from './FadeDelay';

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
        return (<FadeDelay isLoading={loading}>
            <Box flex="1 0 auto" display="flex" justifyContent={'center'} alignItems={'center'}>
                <CircularProgress color="primary" />
            </Box>
        </FadeDelay>)
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