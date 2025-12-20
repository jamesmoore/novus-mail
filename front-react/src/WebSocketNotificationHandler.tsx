import { useEffect, useState } from "react";
import { useWebSocketNotifier, WebSocketMessage } from "./useWebSocketNotifier";
import { useInvalidateMailItemsCache, useMailItems } from "./useMailItems";
import { useParams } from "react-router-dom";
import useUnreadCounts from "./useUnreadCounts";
import { toast } from "sonner";
import useAddressResponse from "./useAddressResponse";

export default function WebSocketNotificationHandler() {

    const { lastJsonMessage } = useWebSocketNotifier();
    const { address: urlAddressSegment } = useParams();
    const { refetch: mailItemsRefetch } = useMailItems(urlAddressSegment);
    const { refetch: unreadRefetch } = useUnreadCounts();
    const { invalidate: invalidateMailItems } = useInvalidateMailItemsCache();
    const [lastReceivedMessage, setLastReceivedMessage] = useState<WebSocketMessage | null>(null);
    const { data: addressesResponse } = useAddressResponse();

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
                        if (addressesResponse && addressesResponse.addresses && addressesResponse.addresses.filter(p => p.addr === address).length > 0) {
                            toast.info("New mail for " + address);
                        }
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
    }, [lastReceivedMessage, invalidateMailItems, unreadRefetch, mailItemsRefetch, urlAddressSegment, setLastReceivedMessage, addressesResponse]);

    return null;
}