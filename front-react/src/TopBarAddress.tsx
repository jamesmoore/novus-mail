import ContentCopy from "@mui/icons-material/ContentCopy";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { fetchDomain } from "./api-client";
import { useQuery } from "@tanstack/react-query";
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
    const { selectedAddress } = useContext(AddressContext);

    async function copyClicked() {
        await handleCopy(getFullAddress());
    }

    function getFullAddress() {
        return `${selectedAddress}@${domainName}`;
    }

    const { data: domainName } = useQuery(
        {
            queryKey: ["domain"],
            queryFn: fetchDomain
        }
    );

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