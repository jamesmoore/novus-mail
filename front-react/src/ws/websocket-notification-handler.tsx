import { useEffect, useState } from "react";
import { useWebSocketNotifier, WebSocketMessage } from "./use-websocket-notifier";
import { useInvalidateMailItemsCache, useMailItems } from "../use-mail-items";
import { useParams } from "react-router-dom";
import useUnreadCounts from "../use-unread-counts";
import { toast } from "sonner";

export default function WebSocketNotificationHandler() {

    const { lastJsonMessage } = useWebSocketNotifier();
    const { address: urlAddressSegment } = useParams();
    const { refetch: mailItemsRefetch } = useMailItems(urlAddressSegment);
    const { refetch: unreadRefetch } = useUnreadCounts();
    const { invalidate: invalidateMailItems } = useInvalidateMailItemsCache();
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

            case 'connected':
                // Handle connected state if needed
                break;

            default:
                console.error('Unhandled message type:', JSON.stringify(lastReceivedMessage));
        }

        setLastReceivedMessage(null);
    }, [lastReceivedMessage, invalidateMailItems, unreadRefetch, mailItemsRefetch, urlAddressSegment, setLastReceivedMessage]);

    return null;
}