import { FC, ReactNode } from 'react';
import useWebSocket from 'react-use-websocket';
import { WebSocketMessage, WebSocketContext } from './useWebSocketNotifier';

export const WebSocketNotificationProvider: FC<{ children: ReactNode; }> = ({ children }) => {
    const webSocketHook = useWebSocket<WebSocketMessage>(import.meta.env.VITE_API_BASE_URL ?? '', {
        onOpen: () => console.log("connected"),
        shouldReconnect: () => true
    });

    return (
        <WebSocketContext.Provider value={webSocketHook}>
            {children}
        </WebSocketContext.Provider>
    );
};
