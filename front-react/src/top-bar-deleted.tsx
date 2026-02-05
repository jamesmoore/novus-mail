import { useDeletedMailItems } from "./use-mail-items";
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

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.mails.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' : `${total + (hasNextPage ? '+' : '')} item${total === 1 ? '' : 's'}`;

    const onDeleteAllMails = async () => {
        await emptyDeletedMails();
    }

    const onRestoreDeletedMails = async () => {
        await restoreDeletedMails();
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
