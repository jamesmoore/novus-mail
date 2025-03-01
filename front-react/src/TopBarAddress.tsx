import ContentCopy from "@mui/icons-material/ContentCopy";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { IconButton, Tooltip, Typography } from "@mui/material";
import useDomain from "./useDomain";
import { useParams } from "react-router-dom";
import { readAllMail } from "./api-client";
import useUnreadCounts from "./useUnreadCounts";
import { useMailItems } from "./useMailItems";

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
    const { refetch } = useMailItems(selectedAddress);

    async function copyClicked() {
        await handleCopy(getFullAddress());
    }

    function getFullAddress() {
        return `${selectedAddress}@${domainName}`;
    }

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
            <Tooltip title="Mark all as read" sx={{ marginLeft: 'auto' }}>
                <IconButton onClick={() => {
                    readAllMail(selectedAddress).then(() => {
                        refetchUread();
                        refetch();
                    });
                }}>
                    <DoneAllIcon />
                </IconButton>
            </Tooltip>
        </>
    )

}

export default TopBarAddress;