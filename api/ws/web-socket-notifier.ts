import { Server } from "http";
import { EventEmitter } from "events";
import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketMessage } from "./web-socket-message.js";
import { sessionParser } from "../routes/auth-routes.js";
import { authMode } from "../auth/passport-config.js";
import { Request, Response } from "express";
import { DatabaseFacade } from "../database-facade.js";

import { IncomingMessage } from "http";
import { Session } from "express-session";

interface PassportUser {
    sub: string;
    [key: string]: unknown;
}

interface PassportSession {
    user?: PassportUser;
}

interface SessionWithPassport extends Session {
    passport?: PassportSession;
}

interface SessionIncomingMessage extends IncomingMessage {
    session: SessionWithPassport;
}

interface WebSocketWithPassportUser extends WebSocket {
    user?: PassportUser;
}

class WebSocketNotifier {
    private wss: WebSocketServer;
    private connectedSockets: Array<WebSocketWithPassportUser>;
    private notificationEmitter: EventEmitter;

    constructor(server: Server, databaseFacade: DatabaseFacade, notificationEmitter: EventEmitter) {
        this.wss = new WebSocketServer({ noServer: true });
        this.notificationEmitter = notificationEmitter;
        this.connectedSockets = [];

        server.on('upgrade', (req, socket, head) => {
            sessionParser(req as Request, {} as Response, () => {
                const session = (req as SessionIncomingMessage).session;

                const user = session?.passport?.user;
                if (authMode !== 'anonymous' && !user) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(req, socket, head, ws => {
                    // Attach session/user to the socket 
                    (ws as WebSocketWithPassportUser).user = user;
                    this.wss.emit('connection', ws, req);
                });

            });
        });

        this.initialize();

        this.notificationEmitter.on('received', async (address: string) => {
            for (const ws of this.connectedSockets) {
                if (authMode !== 'anonymous') {
                    const sub = ws.user?.sub;
                    console.debug("Received message for sub: ", sub);

                    if (!sub) return;

                    const owner = await databaseFacade.getAddress(address);

                    if (owner && owner.owner && owner.owner !== sub) {
                        console.debug("\tSkipping");
                        return;
                    }
                }
                this.sendWebSocketMessage(ws, { type: 'received', value: address });
            }
        });
    }

    private initialize() {
        this.wss.on('connection', (ws: WebSocket) => {
            try {
                this.sendWebSocketMessage(ws, { type: 'connected' });
                this.connectedSockets.push(ws);
                console.debug(`New connection established. Total sockets: ${this.connectedSockets.length}`);

                ws.on('close', () => {
                    const index = this.connectedSockets.indexOf(ws);
                    if (index !== -1) {
                        this.connectedSockets.splice(index, 1);
                        console.debug(`Connection closed. Remaining sockets: ${this.connectedSockets.length}`);
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