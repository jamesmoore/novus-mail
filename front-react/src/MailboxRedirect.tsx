import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAddressResponse from "./useAddressResponse";
import useUnreadCounts from "./useUnreadCounts";

function MailboxRedirect() {
    const navigate = useNavigate();

    const { data: addressResponse } = useAddressResponse();

    const { data: unreadCounts } = useUnreadCounts();

    useEffect(() => {
        if (unreadCounts) {
            const firstUnread = unreadCounts.find(p => p.unread > 0);
            if (firstUnread) {
                navigate('/inbox/' + firstUnread.recipient);
            }
            else if (addressResponse) {
                const address = addressResponse.addresses[0]?.addr;
                if (address) {
                    navigate('/inbox/' + address);
                }
            }
        }
    }, [unreadCounts, addressResponse, navigate])

    return (
        <></>
    );
}

export default MailboxRedirect;