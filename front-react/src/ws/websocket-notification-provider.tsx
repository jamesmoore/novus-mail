import { FC, ReactNode } from 'react';
import useWebSocket from 'react-use-websocket';
import { WebSocketMessage, WebSocketContext } from './use-websocket-notifier';

export const WebSocketNotificationProvider: FC<{ children: ReactNode; }> = ({ children }) => {
    const webSocketHook = useWebSocket<WebSocketMessage>((import.meta.env.VITE_API_BASE_URL ?? '') + '/ws', {
        onOpen: () => console.debug("ws connected"),
        shouldReconnect: () => true
    });

    return (
        <WebSocketContext.Provider value={webSocketHook}>
            {children}
        </WebSocketContext.Provider>
    );
};
