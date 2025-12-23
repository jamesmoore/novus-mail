import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";
import { AddressesResponse } from "./models/addresses-response";
import { UnreadCount } from "./models/unread-count";

function getFirstUnreadOrDefault(
  unreadCounts?: UnreadCount[],
  addressResponse?: AddressesResponse
): string | undefined {
  const firstUnread = unreadCounts?.find(p => p.unread > 0);
  if (firstUnread) return firstUnread.recipient;
  return addressResponse?.addresses[0]?.addr;
}

function MailboxRedirect() {
  const navigate = useNavigate();
  const { data: addressResponse, isLoading: isAddressesLoading } = useAddressResponse();
  const { data: unreadCounts, isLoading: isUnreadLoading } = useUnreadCounts();

  useEffect(() => {
    if (isAddressesLoading || isUnreadLoading) return;

    if (!addressResponse || !unreadCounts) return;

    const firstUnread = getFirstUnreadOrDefault(unreadCounts, addressResponse);
    if (firstUnread) {
      navigate(`/inbox/${firstUnread}`, { replace: true });
    }
    else {
      navigate('/manage');
    }
  }, [unreadCounts, addressResponse, isAddressesLoading, isUnreadLoading, navigate]);

  return null;
}

export default MailboxRedirect;