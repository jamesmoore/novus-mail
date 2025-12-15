import useDomain from "./useDomain";
import { useParams } from "react-router-dom";
import { deleteMails, readAllMail } from "./api-client";
import useUnreadCounts from "./useUnreadCounts";
import { useInvalidateDeletedMailItemsCache, useMailItems } from "./useMailItems";
import { CheckCheck, Copy, Trash } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";

const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy:', err);
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

    const onDeleteAllMails = () => {
        deleteMails(selectedAddress!).then(() => {
            refetchUread();
            refetch();
            invalidateDeleted();
        });
    }

    const onMarkAllAsRead = () => {
        readAllMail(selectedAddress!).then(() => {
            refetchUread();
            refetch();
        });
    }

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');

    return (
        selectedAddress &&
        <>
            <div>
                {getFullAddress()}
            </div>
            <Tooltip>
                <TooltipContent>
                    <p>Copy</p>
                </TooltipContent>
                <TooltipTrigger asChild>
                    <Button className='ml-1' onClick={copyClicked}>
                        <Copy />
                    </Button>
                </TooltipTrigger>
            </Tooltip>

            <Button className='ml-auto hover:bg-red-700' disabled={total === 0} onClick={onDeleteAllMails} >
                <Trash />
            </Button>
            <Tooltip >
                <TooltipContent>
                    <p>Mark all as read</p>
                </TooltipContent>
                <TooltipTrigger asChild>
                    <Button className='ml-1' onClick={onMarkAllAsRead} disabled={total === 0}>
                        <CheckCheck />
                    </Button>
                </TooltipTrigger>
            </Tooltip>
            <div className='ml-1' >{text}</div>
        </>
    )
}

export default TopBarAddress;