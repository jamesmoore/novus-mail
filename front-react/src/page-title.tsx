import { useEffect } from "react";
import useUnreadCounts from "./use-unread-counts";

export default function PageTitle() {

    const { data: unreadCounts } = useUnreadCounts();

    // update page titles
    useEffect(() => {
        const unreadCount = unreadCounts?.map(p => p.unread).reduce((p, q) => p + q, 0) ?? 0;
        const title = `NovusMail${import.meta.env.DEV ? ' [DEV]' : ''}${unreadCount > 0 ? ` (${unreadCount})` : ''}`;
        //document.title = ''; // https://stackoverflow.com/questions/72982365/setting-document-title-doesnt-change-the-tabs-text-after-pressing-back-in-the
        document.title = title;
    }, [unreadCounts]);

    return null;
}