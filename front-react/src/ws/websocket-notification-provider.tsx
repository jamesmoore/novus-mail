import { FC, ReactNode } from 'react';
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { WebSocketMessage, WebSocketContext } from './use-websocket-notifier';

export const WebSocketNotificationProvider: FC<{ children: ReactNode; }> = ({ children }) => {
    const websocketUrl = `${import.meta.env.VITE_API_BASE_URL ?? ''}/ws`;
    const webSocketHook = useWebSocket<WebSocketMessage>(websocketUrl, {
        onOpen: () => console.debug("ws connected"),
        shouldReconnect: () => true
    });

    return (
        <WebSocketContext.Provider value={webSocketHook}>
            {children}
        </WebSocketContext.Provider>
    );
};
