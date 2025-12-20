import { useEffect, useState } from "react";
import { useWebSocketNotifier, WebSocketMessage } from "./useWebSocketNotifier";
import { useInvalidateMailItemsCache, useMailItems } from "./useMailItems";
import { useParams } from "react-router-dom";
import useUnreadCounts from "./useUnreadCounts";
import { toast } from "sonner";

export default function WebSocketNotificationHandler() {

    const { lastJsonMessage } = useWebSocketNotifier();
    const { address: urlAddressSegment } = useParams();
    const { refetch } = useMailItems(urlAddressSegment);
    const { refetch: unreadRefetch } = useUnreadCounts();
    const { invalidate } = useInvalidateMailItemsCache();
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
                unreadRefetch();
                if (urlAddressSegment === lastReceivedMessage.value) {
                    refetch();
                } else if (lastReceivedMessage.value) {
                    invalidate(lastReceivedMessage.value);
                    toast.info("New mail for " + lastReceivedMessage.value);
                }
                break;

            case 'connected':
                // Handle connected state if needed
                break;

            default:
                console.error('Unhandled message type:', JSON.stringify(lastReceivedMessage));
        }

        setLastReceivedMessage(null);
    }, [lastReceivedMessage, invalidate, unreadRefetch, refetch, urlAddressSegment, setLastReceivedMessage]);

    return null;
}