import { Server } from "http";
import { EventEmitter } from "events";
import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketMessage } from "./WebSocketMessage.js";
import { sessionParser } from "./routes/auth.routes.js";
import { authMode } from "./auth/passport-config.js";
import { Request, Response } from "express";

class WebSocketNotifier {
    private wss: WebSocketServer;
    private connectedSockets: Array<WebSocket>;
    private notificationEmitter: EventEmitter;

    constructor(server: Server, notificationEmitter: EventEmitter) {
        this.wss = new WebSocketServer({ noServer: true });
        this.notificationEmitter = notificationEmitter;
        this.connectedSockets = [];

        server.on('upgrade', (req, socket, head) => {
            sessionParser(req as Request, {} as Response, () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const session = (req as any).session;
                console.log(session);

                // 🔐 AUTH CHECK 
                const user = session?.passport?.user;
                if (authMode !== 'anonymous' && (!user || typeof user.sub !== 'string')) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(req, socket, head, ws => {
                    // Attach session/user to the socket 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (ws as any).user = user;
                    this.wss.emit('connection', ws, req);
                });

            });
        });

        this.initialize();

        this.notificationEmitter.on('received', (address: string) => {
            this.connectedSockets.forEach(ws => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any                
                console.log("Received message for sub: ", (ws as any).user?.sub);
                this.sendWebSocketMessage(ws, { type: 'received', value: address });
            });

        });
    }

    private initialize() {
        this.wss.on('connection', (ws: WebSocket) => {
            try {
                this.sendWebSocketMessage(ws, { type: 'connected' });
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

    private sendWebSocketMessage(ws: WebSocket, newLocal: WebSocketMessage) {
        ws.send(JSON.stringify(newLocal));
    }

    public getConnectionCount(): number {
        return this.connectedSockets.length;
    }
}

export default WebSocketNotifier;