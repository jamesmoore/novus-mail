import { useEffect } from "react";
import useUnreadCounts from "./useUnreadCounts";
import useUser from "./useUser";

export default function PageTitle() {

    const { data: user } = useUser();
    const { data: unreadCounts } = useUnreadCounts(user && (!user.requiresAuth || user.isAuthenticated));

    // update page titles
    useEffect(() => {
        const unreadCount = unreadCounts?.map(p => p.unread).reduce((p, q) => p + q, 0) ?? 0;
        const title = `NovusMail${import.meta.env.DEV ? ' [DEV]' : ''}${unreadCount > 0 ? ` (${unreadCount})` : ''}`;
        //document.title = ''; // https://stackoverflow.com/questions/72982365/setting-document-title-doesnt-change-the-tabs-text-after-pressing-back-in-the
        document.title = title;
    }, [unreadCounts]);
    return <></>
}