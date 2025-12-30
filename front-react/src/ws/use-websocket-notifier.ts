import { createContext, useContext } from 'react';
import { WebSocketHook } from 'react-use-websocket/dist/lib/types';

export type ConnectedWebSocketMessage = {
    type: 'connected',
};

export type ReceivedWebSocketMessage = {
    type: 'received',
    value: string
};

export type WebSocketMessage = ReceivedWebSocketMessage | ConnectedWebSocketMessage;

export const WebSocketContext = createContext(null as unknown as WebSocketHook<WebSocketMessage>);

export const useWebSocketNotifier = () => {
    const webSocketHook = useContext(WebSocketContext);

    if (!webSocketHook) {
        throw new Error("useWebSocketNotifier must be used within a WebSocketNotificationProvider");
    }

    return webSocketHook;
};