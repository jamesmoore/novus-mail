import { useWebSocketNotifier } from "./useWebSocketNotifier";
import { ReadyState } from "react-use-websocket";
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "./components/ui/sidebar";

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
        <div className="flex py-1 pr-1">
            <SidebarTrigger />
            <Badge className="ml-auto">
                {getConnectionStateLabel(readyState)}
            </Badge>
        </div>
    );
}

export default TopBarSettings;