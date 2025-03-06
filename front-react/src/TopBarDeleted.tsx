import { IconButton, Typography, useTheme } from "@mui/material";
import { useDeletedMailItems } from "./useMailItems";
import DeleteIcon from '@mui/icons-material/Delete';

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0) ?? 0;
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');

    const theme = useTheme();

    return (
        <>
            <IconButton sx={{ "&:hover": { color: theme.palette.error.main }, marginLeft: 'auto' }} disabled={total === 0}>
                <DeleteIcon />
            </IconButton>
            <Typography>{text}</Typography>
        </>
    )

}

export default TopBarDeleted;