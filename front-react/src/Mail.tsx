import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'
import { deleteMail, fetchMail } from './api-client';
import { useQuery } from '@tanstack/react-query';
import { Button, Container, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';
import applyEmailTemplate from './email-wrapper';
import MailboxItem from './MailboxItem';

function Mail() {
    const navigate = useNavigate();
    const { messageId } = useParams();

    const { data: message, isLoading: loading, error } = useQuery(
        {
            queryKey: ["mail", messageId],
            queryFn: () => messageId ? fetchMail(messageId) : undefined,
        }
    );

    async function backClicked() {
        navigate(-1);
    }

    async function onMailItemDelete(itemKey: string) {
        deleteMail(itemKey)
            .then(() => {
                navigate(-1);
            })
            .catch(error => {
                console.error('Failed to delete mail ' + error);
            });
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error">{error.message}</div>;
    }

    return (
        <Grid container flexDirection='column' height='100vh'  >
            <Container sx={{ display: 'flex', flexDirection: 'column', flex: "1 0 auto" }}>
                {message &&
                    <>
                        <MailboxItem mail={{ id: messageId!, sender: message.sender, subject: message.subject }} onDelete={onMailItemDelete} />
                        <Paper sx={{ flexGrow: 1, flexShrink: 1, overflow: "auto", p: 1, display: "flex", flexDirection: "column" }} elevation={3}>
                            <iframe
                                height="100%"
                                srcDoc={applyEmailTemplate(message.content)}
                                style={{ border: "none", backgroundColor: "white", borderRadius: "4px", }}
                                sandbox="allow-popups allow-popups-to-escape-sandbox"
                            ></iframe>
                        </Paper>
                    </>}
            </Container >

            <Paper sx={{ p: 1, flex: "0 0 auto" }} elevation={3}>
                <Button onClick={backClicked}>Back</Button>
                <Button onClick={() => { navigate('/manage'); }} className="adaptWidthSmall">Manage addresses</Button>
            </Paper>
        </Grid>
    );
}

export default Mail;