import ContentCopy from "@mui/icons-material/ContentCopy";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import useDomain from "./useDomain";
import { useParams } from "react-router-dom";
import { readAllMail } from "./api-client";
import useUnreadCounts from "./useUnreadCounts";
import { useMailItems } from "./useMailItems";
import DeleteIcon from '@mui/icons-material/Delete';

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
    const theme = useTheme();

    async function copyClicked() {
        await handleCopy(getFullAddress());
    }

    function getFullAddress() {
        return `${selectedAddress}@${domainName}`;
    }

    const newFunction = () => {
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
            <Typography variant="h6" noWrap component="div">
                {getFullAddress()}
            </Typography>
            <Tooltip title="Copy">
                <IconButton onClick={copyClicked}>
                    <ContentCopy />
                </IconButton>
            </Tooltip>

            <IconButton sx={{ "&:hover": { color: theme.palette.error.main }, marginLeft: 'auto' }} disabled={total === 0}>
                <DeleteIcon />
            </IconButton>
            <Tooltip title="Mark all as read" >
                <IconButton onClick={newFunction} disabled={total === 0}>
                    <DoneAllIcon sx={{ "&:hover": { color: theme.palette.primary.main } }} />
                </IconButton>
            </Tooltip>
            <Typography sx={{ ml: 1 }}>{text}</Typography>
        </>
    )
}

export default TopBarAddress;