import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";
import { AddressesResponse } from "./models/addresses-response";
import { UnreadCount } from "./models/unread-count";
import { fetchUser } from "./api-client";
import { User } from "./models/user";

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
  const [user, setUser] = useState<User>();
  useEffect(() => {
    fetchUser().then((p) => setUser(p));
  }, []);

  const { data: addressResponse, isLoading: isAddressesLoading } = useAddressResponse();
  const { data: unreadCounts, isLoading: isUnreadLoading } = useUnreadCounts();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.isAuthenticated && user.requiresAuth) {
      navigate('/login')
    }

    if (isAddressesLoading || isUnreadLoading) return;

    if (!addressResponse || !unreadCounts) return;

    const firstUnread = getFirstUnreadOrDefault(unreadCounts, addressResponse);
    if (firstUnread) {
      navigate(`/inbox/${firstUnread}`, { replace: true });
    }
  }, [unreadCounts, addressResponse, isAddressesLoading, isUnreadLoading, navigate, user]);

  return null;
}

export default MailboxRedirect;