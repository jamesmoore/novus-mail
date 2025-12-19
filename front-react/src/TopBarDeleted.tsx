import { useDeletedMailItems, useInvalidateDeletedMailItemsCache } from "./useMailItems";
import { emptyDeletedMails } from "./api-client";
import { Trash } from 'lucide-react';
import { Button } from "./components/ui/button";
import { SidebarTrigger } from "./components/ui/sidebar";

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();

    const onDeleteAllMails = () => {
        emptyDeletedMails().then(() => {
            invalidateDeleted();
        });
    }

    return (
        <div className="flex items-center">
            <SidebarTrigger />
            <Button className='ml-auto hover:bg-red-700' /*sx={{ "&:hover": { color: theme.palette.error.main } }}*/ disabled={total === 0} onClick={onDeleteAllMails}>
                <Trash /> {text}
            </Button>
        </div>
    )

}

export default TopBarDeleted;
