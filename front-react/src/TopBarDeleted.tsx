import { useDeletedMailItems, useInvalidateAllMailItemsCache, useInvalidateDeletedMailItemsCache } from "./useMailItems";
import { emptyDeletedMails, restoreDeletedMails } from "./api-client";
import { Trash, Undo } from 'lucide-react';
import { Button } from "./components/ui/button";
import { SidebarTrigger } from "./components/ui/sidebar";

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();
    const { invalidate: invalidateAllMails } = useInvalidateAllMailItemsCache();
    const onDeleteAllMails = () => {
        emptyDeletedMails().then(() => {
            invalidateDeleted();
        });
    }

    const onRestoreDeletedMails = () => {
        restoreDeletedMails().then(() => {
            invalidateDeleted();
            invalidateAllMails();
        });
    }

    return (
        <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button className='ml-auto' disabled={total === 0} onClick={onRestoreDeletedMails}>
                <Undo /> {total > 0 ? 'Restore ' + text : ''}
            </Button>
            <Button className='hover:bg-destructive' disabled={total === 0} onClick={onDeleteAllMails}>
                <Trash /> {total > 0 ? 'Empty ' + text : ''}
            </Button>
        </div>
    )

}

export default TopBarDeleted;
