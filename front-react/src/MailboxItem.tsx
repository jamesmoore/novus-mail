import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import { Mail } from "./models/mail";
import { isEnterKeyUp, isLeftMouseClick } from "./Events";
import humanizeDuration from "humanize-duration";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMail } from "./api-client";
import ShadowEmail from "./ShadowEmail";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Trash } from "lucide-react";

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

    const paperClassName = "rounded-sm bg-sidebar shadow-md";

    return (
        <>
            <div
                className={paperClassName + ' w-full hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:shadow-lg hover:cursor-pointer'}
                //elevation={hover ? 3 : 1}
                tabIndex={1}
                role="button"
                onKeyUp={(e) => mailKeyUp(e, mail.id)}
                onClick={(e) => mailClicked(e, mail.id)}
                onPointerEnter={() => { setHover(true); }}
                onPointerLeave={() => { setHover(false); }}
                key={mail.id}
            >
                <div className="flex gap-2 px-2 py-1 ">
                    {/* Main content */}
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 min-w-0">

                        {/* Sender */}
                        <div className="md:w-40 truncate">
                            {mail.sendername ? (
                                <Tooltip delayDuration={700}>
                                    <TooltipTrigger asChild>
                                        <span className={` ${mail.read ? "" : "font-bold"}`}>{mail.sendername}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">{mail.sender}</TooltipContent>
                                </Tooltip>
                            ) : (
                                <span>{mail.sender}</span>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div
                                className={`truncate ${mail.read ? "text-muted-foreground" : "font-bold highlight-color"}`}
                            >
                                {mail.subject}
                            </div>
                        </div>

                        {/* Date */}
                        {mail.received !== 0 && (
                            <div className="text-muted-foreground md:whitespace-nowrap">
                                <Tooltip delayDuration={700}>
                                    <TooltipTrigger asChild>
                                        <span>{timeSince(mail.received)}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">{new Date(mail.received).toLocaleString()}</TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    {/* Trash (always right aligned) */}
                    <div className="flex items-center ml-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="delete"
                            onClick={(e) => deleteClicked(e, mail.id)}
                            onKeyUp={(e) => deleteKeyUp(e, mail.id)}
                        >
                            {!hover ? <Trash /> : <Trash className="text-destructive" />}
                        </Button>
                    </div>
                </div>
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