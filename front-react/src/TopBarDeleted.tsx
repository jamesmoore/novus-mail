import { Box, Typography } from "@mui/material";
import { useDeletedMailItems } from "./useMailItems";

function TopBarDeleted() {

    const { data, hasNextPage } = useDeletedMailItems();

    const total = data?.pages.reduce((p, q) => p + q.data.length, 0);
    const text = total === 0 ? 'Empty' :
        total + (hasNextPage ? '+' : '') + ' item' + (total === 1 ? '' : 's');

    return (
        <Box sx={{ marginLeft: 'auto' }}>
            <Typography>{text}</Typography>
        </Box>
    )

}

export default TopBarDeleted;