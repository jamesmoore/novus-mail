import { Server } from "http";
import { EventEmitter } from "events";
import WebSocket, { WebSocketServer } from 'ws';

class WebSocketNotifier {
    private wss: WebSocketServer;
    private connectedSockets: Array<WebSocket>;
    private notificationEmitter: EventEmitter;

    constructor(server: Server, notificationEmitter: EventEmitter) {
        this.wss = new WebSocketServer({ server });
        this.notificationEmitter = notificationEmitter;
        this.connectedSockets = [];
        
        this.initialize();

        this.notificationEmitter.on('received', (address: string) => { 
            this.connectedSockets.forEach(ws => {
                ws.send(JSON.stringify({ type: 'received', value: address }));
            });
        
        });
    }

    private initialize() {
        this.wss.on('connection', (ws: WebSocket) => {
            try {
                ws.send(JSON.stringify({ type: 'connected' }));
                this.connectedSockets.push(ws);
                console.log(`New connection established. Total sockets: ${this.connectedSockets.length}`);
                
                ws.on('close', () => {
                    const index = this.connectedSockets.indexOf(ws);
                    if (index !== -1) {
                        this.connectedSockets.splice(index, 1);
                        console.log(`Connection closed. Remaining sockets: ${this.connectedSockets.length}`);
                    } else {
                        console.error("Socket not found in list when closing");
                    }
                });
            } catch (error) {
                console.error('Error establishing connection:', error);
                ws.close();
            }
        });

        setInterval(() => {
            this.connectedSockets = this.connectedSockets.filter(socket => socket.readyState === WebSocket.OPEN);
        }, 5000);
    }

    public getConnectionCount(): number {
        return this.connectedSockets.length;
    }
}

export default WebSocketNotifier;