import { IconButton, Typography, useTheme } from "@mui/material";
import { useDeletedMailItems, useInvalidateDeletedMailItemsCache } from "./useMailItems";
import DeleteIcon from '@mui/icons-material/Delete';
import { emptyDeletedMails } from "./api-client";

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');
    const { invalidate: invalidateDeleted } = useInvalidateDeletedMailItemsCache();
    const theme = useTheme();

    const onDeleteAllMails = () => {
        emptyDeletedMails().then(() => {
            invalidateDeleted();
        });
    }

    return (
        <>
            <IconButton sx={{ "&:hover": { color: theme.palette.error.main }, marginLeft: 'auto' }} disabled={total === 0} onClick={onDeleteAllMails}>
                <DeleteIcon />
            </IconButton>
            <Typography>{text}</Typography>
        </>
    )

}

export default TopBarDeleted;
