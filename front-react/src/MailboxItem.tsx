import { IconButton, SxProps, Theme, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid';
import { Mail } from "./models/mail";
import { isEnterKeyUp, isLeftMouseClick } from "./Events";
import humanizeDuration from "humanize-duration";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMail } from "./api-client";
import ShadowEmail from "./ShadowEmail";
import { useNavigate, useParams } from "react-router-dom";

interface MailboxItemProps {
    mail: Mail;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
    opened: boolean;
}

function timeSince(timeStamp: number) {
    return humanizeDuration(new Date().getTime() - timeStamp, { largest: 1, round: true });
}

function MailboxItem({ mail, onSelect, onDelete, opened }: MailboxItemProps) {

    const [hover, setHover] = useState(false);
    const [showMail, setShowMail] = useState(opened);
    const navigate = useNavigate();
    const { address: selectedAddress } = useParams();
    const showInline = true;

    async function mailClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
        if (showInline) {
            if (isLeftMouseClick(e) && onSelect) {
                const newState = !showMail;
                setShowMail(newState);
                onSelect(itemKey);
            }
        }
        else {
            if (!showMail) {
                navigate(`/mail/${selectedAddress}/${mail.id}`);
            }
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

    const { data: message, isLoading: loading, error } = useQuery(
        {
            queryKey: ["mail", mail.id],
            queryFn: () => mail.id ? fetchMail(mail.id) : undefined,
            enabled: showMail,
        }
    );

    const fontWeight = mail.read ? 400 : 700;
    const style: SxProps<Theme> = {
        fontWeight: fontWeight,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    };

    const paperClassName = "rounded-sm bg-neutral-900 shadow-md";

    return (
        <>
            <div
                className = {paperClassName + ' w-full hover:bg-neutral-800 hover:shadow-lg hover:cursor-pointer'}
                //elevation={hover ? 3 : 1}
                tabIndex={1}
                role="button"
                onKeyUp={(e) => mailKeyUp(e, mail.id)}
                onClick={(e) => mailClicked(e, mail.id)}
                onPointerEnter={() => { setHover(true); }}
                onPointerLeave={() => { setHover(false); }}
                key={mail.id}
            >
                <Grid container columns={24} sx={{ ml: 1 }} flex="1 1 auto">
                    <Grid container size={{ xs: 22, md: 23 }} alignItems='center'>
                        <Grid size={{ xs: 24, md: 6 }} >
                            {
                                mail.sendername ?
                                    <Tooltip title={mail.sender}>
                                        <Typography sx={style}>{mail.sendername}</Typography>
                                    </Tooltip>
                                    :
                                    <Typography sx={style}>{mail.sender}</Typography>
                            }

                        </Grid>
                        <Grid
                            size={{ xs: 24, md: 15 }}>
                            <Typography sx={style} color={mail.read ? "textPrimary" : "primary"}>{mail.subject}</Typography>
                        </Grid>
                        <Grid container
                            size={{ md: 3 }}
                            justifyContent='right'
                            sx={style}
                        >
                            {mail.received !== 0 &&
                                <Tooltip title={new Date(mail.received).toLocaleString()}>
                                    <Typography>{timeSince(mail.received)}</Typography>
                                </Tooltip>
                            }
                        </Grid>
                    </Grid>
                    <Grid container size={{ xs: 2, md: 1 }} justifyContent='right' alignItems='center'>
                        <IconButton aria-label="delete" onKeyUp={(e) => deleteKeyUp(e, mail.id)} onClick={(e) => deleteClicked(e, mail.id)} >
                            {!hover && <DeleteOutlineIcon color="action" opacity={0.3} />}
                            {hover && <DeleteIcon color="error" />}
                        </IconButton>
                    </Grid>
                </Grid>
            </div>
            {
                showMail && message && !loading &&
                <div className={'mb-1 w-full min-w-0 ' + paperClassName}>
                    <ShadowEmail html={message.content} />
                </div>
            }
            {
                error &&
                <div className={'mb-1 ' + paperClassName} >
                    {error.message}
                </div>
            }
        </>
    )
}

export default MailboxItem;