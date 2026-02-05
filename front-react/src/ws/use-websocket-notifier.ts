import { createContext, useContext } from 'react';
import { WebSocketHook } from 'react-use-websocket/dist/lib/types';

export type ConnectedWebSocketMessage = {
    type: 'connected',
};

export type ReceivedWebSocketMessage = {
    type: 'received',
    value: string
};

export type ReadWebSocketMessage = {
    type: 'read',
    value: string
};

export type SoftDeletedWebSocketMessage = {
    type: 'softDeleted',
    value: string
};

export type HardDeletedWebSocketMessage = {
    type: 'hardDeleted',
    value: string
};

export type BinEmptiedWebSocketMessage = {
    type: 'binEmptied'
};

export type BinRestoredWebSocketMessage = {
    type: 'binRestored'
};

export type AddressAddedWebSocketMessage = {
    type: 'addressAdded'
};

export type AddressUpdatedWebSocketMessage = {
    type: 'addressUpdated'
};

export type AddressDeletedWebSocketMessage = {
    type: 'addressDeleted'
};

export type WebSocketMessage = ReceivedWebSocketMessage | ConnectedWebSocketMessage | ReadWebSocketMessage | SoftDeletedWebSocketMessage | HardDeletedWebSocketMessage | BinEmptiedWebSocketMessage | BinRestoredWebSocketMessage | AddressAddedWebSocketMessage | AddressUpdatedWebSocketMessage | AddressDeletedWebSocketMessage;

export const WebSocketContext = createContext(null as unknown as WebSocketHook<WebSocketMessage>);

export const useWebSocketNotifier = () => {
    const webSocketHook = useContext(WebSocketContext);

    if (!webSocketHook) {
        throw new Error("useWebSocketNotifier must be used within a WebSocketNotificationProvider");
    }

    return webSocketHook;
};