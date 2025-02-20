import ContentCopy from "@mui/icons-material/ContentCopy";
import { IconButton, Tooltip, Typography } from "@mui/material";
import useDomain from "./useDomain";
import { useContext } from "react";
import AddressContext from "./AddressContext";

const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

function TopBarAddress() {

    const { data: domainName } = useDomain();

    const { selectedAddress } = useContext(AddressContext);

    async function copyClicked() {
        await handleCopy(getFullAddress());
    }

    function getFullAddress() {
        return `${selectedAddress}@${domainName}`;
    }

    return (
        <>
            <Typography variant="h6" noWrap component="div">
                {getFullAddress()}
            </Typography>
            <Tooltip title="Copy">
                <IconButton onClick={copyClicked}>
                    <ContentCopy />
                </IconButton>
            </Tooltip>
        </>
    )

}

export default TopBarAddress;