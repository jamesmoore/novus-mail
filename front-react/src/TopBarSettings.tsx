import { useWebSocketNotifier } from "./ws/useWebSocketNotifier";
import { ReadyState } from "react-use-websocket";
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "./components/ui/sidebar";
import { CircleCheck, CirclePause, CircleX } from "lucide-react";

const getConnectionStateLabel = (state: ReadyState) => {
    switch (state) {
        case ReadyState.UNINSTANTIATED:
            return <><CircleX className="text-red-400" /> Uninstantiated</>;
        case ReadyState.CONNECTING:
            return <><CirclePause className="text-orange-500" /> Connecting</>;
        case ReadyState.OPEN:
            return <><CircleCheck className="text-green-400" /> Connected</>;
        case ReadyState.CLOSING:
            return <><CirclePause className="text-orange-500" /> Closing</>;
        case ReadyState.CLOSED:
            return <><CircleX className="text-red-400 " /> Closed</>;
        default:
            return '';
    }
};

export function TopBarSettings() {
    const { readyState } = useWebSocketNotifier();

    return (
        <div className="flex py-1 pr-1 items-center">
            <SidebarTrigger />
            <Badge variant="secondary" className="ml-auto h-6">
                {getConnectionStateLabel(readyState)}
            </Badge>
        </div>
    );
}

export default TopBarSettings;