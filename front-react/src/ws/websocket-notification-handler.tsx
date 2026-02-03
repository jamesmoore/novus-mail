import { useEffect, useState } from "react";
import { useWebSocketNotifier, WebSocketMessage } from "./use-websocket-notifier";
import { useInvalidateAllMailItemsCache, useInvalidateDeletedMailItemsCache, useInvalidateMailItemsCache, useMailItems } from "../use-mail-items";
import { useParams } from "react-router-dom";
import useUnreadCounts from "../use-unread-counts";
import { toast } from "sonner";

export default function WebSocketNotificationHandler() {

    const { lastJsonMessage } = useWebSocketNotifier();
    const { address: urlAddressSegment } = useParams();
    const { refetch: mailItemsRefetch } = useMailItems(urlAddressSegment);
    const { refetch: unreadRefetch } = useUnreadCounts();
    const { invalidate: invalidateMailItems } = useInvalidateMailItemsCache();
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();
    const { invalidate: invalidateAllMails } = useInvalidateAllMailItemsCache();
    const [lastReceivedMessage, setLastReceivedMessage] = useState<WebSocketMessage | null>(null);

    useEffect(() => {
        setLastReceivedMessage(lastJsonMessage);
    },
        [lastJsonMessage]
    )

    useEffect(() => {
        if (!lastReceivedMessage) return;

        switch (lastReceivedMessage.type) {
            case 'received':
                {
                    unreadRefetch();
                    const address = lastReceivedMessage.value;
                    if (urlAddressSegment === address) {
                        mailItemsRefetch();
                    } else if (address) {
                        invalidateMailItems(address);
                        toast.info("New mail for " + address);
                    }
                }
                break;

            case 'read':
                {
                    unreadRefetch();
                    const address = lastReceivedMessage.value;
                    if (urlAddressSegment === address) {
                        mailItemsRefetch();
                    } else {
                        invalidateMailItems(address);
                    }
                }
                break;

            case 'softDeleted':
                {
                    // Mail moved to trash - refresh source mailbox and invalidate deleted
                    unreadRefetch();
                    const address = lastReceivedMessage.value;
                    if (urlAddressSegment === address) {
                        mailItemsRefetch();
                    } else {
                        invalidateMailItems(address);
                    }
                    invalidateDeleted();
                }
                break;

            case 'hardDeleted':
                {
                    // Mail permanently deleted from trash - refresh deleted mailbox
                    const address = lastReceivedMessage.value;
                    if (urlAddressSegment === address) {
                        mailItemsRefetch();
                    } else {
                        invalidateMailItems(address);
                    }
                    invalidateDeleted();
                }
                break;

            case 'binEmptied':
                {
                    // All deleted mails removed - just invalidate deleted cache
                    invalidateDeleted();
                }
                break;

            case 'binRestored':
                {
                    // Deleted mails restored to inbox - invalidate both deleted and all mailboxes
                    unreadRefetch();
                    invalidateDeleted();
                    invalidateAllMails();
                    mailItemsRefetch();
                }
                break;

            case 'connected':
                // Handle connected state if needed
                break;

            default:
                console.error('Unhandled message type:', JSON.stringify(lastReceivedMessage));
        }

        setLastReceivedMessage(null);
    }, [lastReceivedMessage, invalidateMailItems, invalidateDeleted, invalidateAllMails, unreadRefetch, mailItemsRefetch, urlAddressSegment, setLastReceivedMessage]);

    return null;
}