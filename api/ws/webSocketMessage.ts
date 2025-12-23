export type ConnectedWebSocketMessage = {
    type: 'connected',
};

export type ReceivedWebSocketMessage = {
    type: 'received',
    value: string
};

export type WebSocketMessage = ReceivedWebSocketMessage | ConnectedWebSocketMessage;