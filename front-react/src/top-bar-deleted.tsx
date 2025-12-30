import { useDeletedMailItems, useInvalidateAllMailItemsCache, useInvalidateDeletedMailItemsCache } from "./use-mail-items";
import { emptyDeletedMails, restoreDeletedMails } from "./api-client";
import { Trash, Undo } from 'lucide-react';
import { Button } from "./components/ui/button";
import { SidebarTrigger } from "./components/ui/sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import useUnreadCounts from "./use-unread-counts";

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' : `${total + (hasNextPage ? '+' : '')} item${total === 1 ? '' : 's'}`;
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();
    const { invalidate: invalidateAllMails } = useInvalidateAllMailItemsCache();
    const { refetch: refetchUread } = useUnreadCounts();

    const onDeleteAllMails = async () => {
        await emptyDeletedMails();
        await invalidateDeleted();
    }

    const onRestoreDeletedMails = async () => {
        await restoreDeletedMails();
        await invalidateDeleted();
        await invalidateAllMails();
        await refetchUread();
    }

    return (
        <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button className='ml-auto' disabled={total === 0} onClick={onRestoreDeletedMails}>
                <Undo /> {total > 0 ? 'Restore ' + text : ''}
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className='hover:bg-destructive' disabled={total === 0}>
                        <Trash /> {total > 0 ? 'Empty ' + text : ''}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Empty deleted mail?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all items in the deleted folder.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteAllMails}>
                            Empty
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )

}

export default TopBarDeleted;
