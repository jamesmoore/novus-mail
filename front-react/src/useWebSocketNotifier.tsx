import { createContext, useContext, ReactNode, FC } from 'react';
import useWebSocket from "react-use-websocket";
import { WebSocketHook } from 'react-use-websocket/dist/lib/types';

export interface WebSocketMessage {
    type: string,
    value: string
}

const WebSocketContext = createContext(null as unknown as WebSocketHook<WebSocketMessage>);

export const WebSocketProvider: FC<{ children: ReactNode }> = ({ children }) => {
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

export const useWebSocketNotifier = () => {
    const webSocketHook = useContext(WebSocketContext);

    if (!webSocketHook) {
        throw new Error("useWebSocketNotifier must be used within a WebSocketProvider");
    }

    return webSocketHook;
};