import { IconButton, Paper } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid2';
import { Mail } from "./models/mail";
import { isEnterKeyUp, isLeftMouseClick } from "./Events";

interface MailboxItemProps {
    mail: Mail;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
}

function MailboxItem({ mail, onSelect, onDelete }: MailboxItemProps) {

    async function mailClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
        if (isLeftMouseClick(e) && onSelect) {
            onSelect(itemKey);
        }
    }

    async function mailKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
        if (isEnterKeyUp(e) && onSelect) {
            onSelect(itemKey);
        }
    }

    async function deleteClicked(e: React.MouseEvent<HTMLButtonElement>, itemKey: string) {
        e.stopPropagation();
        if (isLeftMouseClick(e) && onDelete) {
            onDelete(itemKey);
        }
    }

    async function deleteKeyUp(e: React.KeyboardEvent<HTMLButtonElement>, itemKey: string) {
        e.stopPropagation();
        if (isEnterKeyUp(e) && onDelete) {
            onDelete(itemKey);
        }
    }

    const cursor = onSelect ? "pointer" : "default";

    return (
        <Paper sx={{ mt: 1, mb: 1, "&:hover": { cursor: cursor } }} elevation={3} tabIndex={1} role="button" onKeyUp={(e) => mailKeyUp(e, mail.id)} onClick={(e) => mailClicked(e, mail.id)}>
            <Grid container sx={{ ml: 1 }}>
                <Grid container size={11} key={mail.id} alignItems='center'>
                    <Grid size={{ xs: 12, md: 4 }} >
                        {mail.sender}
                    </Grid>
                    <Grid
                        size={{ md: 8 }}
                        sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}>
                        {mail.subject}
                    </Grid>
                </Grid>
                <Grid container size={1} justifyContent='right' alignItems='center'>
                    <IconButton color="error" aria-label="delete" onKeyUp={(e) => deleteKeyUp(e, mail.id)} onClick={(e) => deleteClicked(e, mail.id)} >
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default MailboxItem;