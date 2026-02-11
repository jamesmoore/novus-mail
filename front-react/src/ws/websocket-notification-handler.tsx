import { useEffect, useRef, useState } from "react";
import { useWebSocketNotifier, WebSocketMessage } from "./use-websocket-notifier";
import { useResetAllMailItemsCache, useResetDeletedMailItemsCache, useReconcileMailbox } from "../use-mail-items";
import { useParams } from "react-router-dom";
import { useInvalidateUnreadCounts } from "../use-unread-counts";
import { toast } from "sonner";
import { useInvalidateAddress } from "../use-address-response";

export default function WebSocketNotificationHandler() {

    const { lastJsonMessage } = useWebSocketNotifier();
    const { address: urlAddressSegment } = useParams();
    const { invalidate: invalidateUnreadCounts } = useInvalidateUnreadCounts();
    const { reset: resetDeleted } = useResetDeletedMailItemsCache();
    const { reset: resetAllMails } = useResetAllMailItemsCache();
    const { invalidate: invalidateAddresses } = useInvalidateAddress();
    const [lastReceivedMessage, setLastReceivedMessage] = useState<WebSocketMessage | null>(null);
    const { reconcile } = useReconcileMailbox();
    const hasConnectedOnceRef = useRef(false);

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
                    invalidateUnreadCounts();
                    const address = lastReceivedMessage.value;
                    reconcile(address);
                    // Only show a toast if the user is not currently viewing this mailbox
                    if (urlAddressSegment !== address) {
                        toast.info("New mail for " + address);
                    }
                }
                break;

            case 'read':
                {
                    invalidateUnreadCounts();
                    const address = lastReceivedMessage.value;
                    reconcile(address);
                }
                break;

            case 'softDeleted':
                {
                    // Mail moved to trash - refresh source mailbox and reset deleted mailbox cache
                    invalidateUnreadCounts();
                    const address = lastReceivedMessage.value;
                    reconcile(address);
                    resetDeleted();
                }
                break;

            case 'hardDeleted':
                {
                    // Mail permanently deleted from trash - refresh deleted mailbox
                    resetDeleted();
                }
                break;

            case 'binEmptied':
                {
                    // All deleted mails removed - just reset deleted cache
                    resetDeleted();
                }
                break;

            case 'binRestored':
                {
                    // Deleted mails restored to inbox - invalidate both deleted and all mailboxes
                    invalidateUnreadCounts();
                    resetDeleted();
                    resetAllMails();
                }
                break;

            case 'addressAdded':
            case 'addressUpdated':
            case 'addressDeleted':
                {
                    // Address list changed - invalidate addresses query to trigger refetch for active observers / mark data as stale
                    invalidateAddresses();
                }
                break;

            case 'connected':
                if (!hasConnectedOnceRef.current) {
                    hasConnectedOnceRef.current = true;
                    break;
                }

                invalidateUnreadCounts();
                resetDeleted();
                invalidateAddresses();
                if (urlAddressSegment) {
                    reconcile(urlAddressSegment);
                }
                break;

            default:
                console.error('Unhandled message type:', JSON.stringify(lastReceivedMessage));
        }

        setLastReceivedMessage(null);
    }, [
        lastReceivedMessage,
        invalidateUnreadCounts,
        resetDeleted,
        resetAllMails,
        invalidateAddresses,
        urlAddressSegment,
        setLastReceivedMessage,
        reconcile]);

    return null;
}

