import { Chip } from "@mui/material";
import { useWebSocketNotifier } from "./useWebSocketNotifier";
import { ReadyState } from "react-use-websocket";

const getConnectionStateLabel = (state: ReadyState) => {
    switch (state) {
        case ReadyState.UNINSTANTIATED:
            return '🔴 Uninstantiated';
        case ReadyState.CONNECTING:
            return '🟠 Connecting';
        case ReadyState.OPEN:
            return '🟢 Connected';
        case ReadyState.CLOSING:
            return '🟠 Closing';
        case ReadyState.CLOSED:
            return '🔴 Closed';
        default:
            return '';
    }
};

export function TopBarSettings() {
    const { readyState } = useWebSocketNotifier();

    return (
        <Chip
            label={getConnectionStateLabel(readyState)}
            sx={{ marginLeft: 'auto' }}
        />
    );
}

export default TopBarSettings;