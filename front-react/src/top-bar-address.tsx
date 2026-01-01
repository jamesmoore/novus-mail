import useDomain from "./use-domain";
import { useParams } from "react-router-dom";
import { deleteMails, readAllMail } from "./api-client";
import useUnreadCounts from "./use-unread-counts";
import { useInvalidateDeletedMailItemsCache, useMailItems } from "./use-mail-items";
import { CheckCheck, Copy, Trash } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
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
import { toast } from "sonner";

const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(text + ' copied');
    } catch {
        toast.error('Could not copy');
    }
};

function TopBarAddress() {

    const { data: domainName } = useDomain();
    const { address: selectedAddress } = useParams();
    const { refetch: refetchUread } = useUnreadCounts();
    const { refetch, data, hasNextPage } = useMailItems(selectedAddress);
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();

    async function copyClicked() {
        await handleCopy(getFullAddress());
    }

    function getFullAddress() {
        return `${selectedAddress}@${domainName}`;
    }

    const onDeleteAllMails = async () => {
        await deleteMails(selectedAddress!);
        await refetchUread();
        await refetch();
        await invalidateDeleted();
    }

    const onMarkAllAsRead = async () => {
        await readAllMail(selectedAddress!);
        await refetchUread();
        await refetch();
    }

    const total = data?.pages.reduce((p, q) => p + q.mails.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');

    return (
        selectedAddress &&
        <div className="flex items-center">
            <SidebarTrigger />
            <div className="ml-1">
                {getFullAddress()}
            </div>
            <Tooltip delayDuration={700}>
                <TooltipContent>
                    <p>Copy</p>
                </TooltipContent>
                <TooltipTrigger asChild>
                    <Button onClick={copyClicked} variant="ghost">
                        <Copy />
                    </Button>
                </TooltipTrigger>
            </Tooltip>

            <AlertDialog>
                <Tooltip delayDuration={700}>
                    <TooltipContent>
                        <p>Delete all</p>
                    </TooltipContent>
                    <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                            <Button className='ml-auto hover:text-destructive' variant="ghost" disabled={total === 0}>
                                <Trash />
                            </Button>
                        </AlertDialogTrigger>
                    </TooltipTrigger>
                </Tooltip>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete all mail?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete all mail for {getFullAddress()}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteAllMails}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Tooltip delayDuration={700}>
                <TooltipContent>
                    <p>Mark all as read</p>
                </TooltipContent>
                <TooltipTrigger asChild>
                    <Button variant="ghost" onClick={onMarkAllAsRead} disabled={total === 0}>
                        <CheckCheck />
                    </Button>
                </TooltipTrigger>
            </Tooltip>
            <div className='ml-1' >{text}</div>
        </div>
    )
}

export default TopBarAddress;
