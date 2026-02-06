import { Server } from "http";
import { NotificationEmitter } from "../events/notification-emitter.js";
import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketMessage } from "./web-socket-message.js";
import { sessionParser } from "../routes/auth-routes.js";
import { authMode } from "../auth/passport-config.js";
import { Request, Response } from "express";
import { DatabaseFacade } from "../db/database-facade.js";

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
    private notificationEmitter: NotificationEmitter;

    constructor(server: Server, databaseFacade: DatabaseFacade, notificationEmitter: NotificationEmitter) {
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

        const broadcastAddressEvent = async (eventType: 'received' | 'read' | 'softDeleted' | 'hardDeleted', address: string) => {
            let socketsToNotify: WebSocketWithPassportUser[] = [];
            if (authMode === 'oidc') {
                const addressRecord = await databaseFacade.getAddress(address);
                if (addressRecord) {
                    socketsToNotify = this.connectedSockets.filter(ws => ws.user?.sub).filter(ws => !addressRecord.owner || addressRecord.owner === ws.user!.sub);
                }
            }
            else {
                socketsToNotify = this.connectedSockets;
            }
            for (const ws of socketsToNotify) {
                this.sendWebSocketMessage(ws, { type: eventType, value: address });
            }
        };

        const broadcastGlobalEvent = (eventType: 'binEmptied' | 'binRestored' | 'addressAdded' | 'addressUpdated' | 'addressDeleted', owner: string | undefined) => {
            const socketsToNotify = authMode === 'oidc' && owner ? 
                this.connectedSockets.filter(ws => ws.user?.sub === owner) : 
                this.connectedSockets;

            for (const ws of socketsToNotify) {
                this.sendWebSocketMessage(ws, { type: eventType });
            }
        };

        this.notificationEmitter.on('received', async (address: string) => {
            await broadcastAddressEvent('received', address);
        });

        this.notificationEmitter.on('read', async (address: string) => {
            await broadcastAddressEvent('read', address);
        });

        this.notificationEmitter.on('softDeleted', async (address: string) => {
            await broadcastAddressEvent('softDeleted', address);
        });

        this.notificationEmitter.on('hardDeleted', async (address: string) => {
            await broadcastAddressEvent('hardDeleted', address);
        });

        this.notificationEmitter.on('binEmptied', (owner: string | undefined) => {
            broadcastGlobalEvent('binEmptied', owner);
        });

        this.notificationEmitter.on('binRestored', (owner: string | undefined) => {
            broadcastGlobalEvent('binRestored', owner);
        });

        this.notificationEmitter.on('addressAdded', (owner: string | undefined) => {
            broadcastGlobalEvent('addressAdded', owner);
        });

        this.notificationEmitter.on('addressUpdated', (owner: string | undefined) => {
            broadcastGlobalEvent('addressUpdated', owner);
        });

        this.notificationEmitter.on('addressDeleted', (owner: string | undefined) => {
            broadcastGlobalEvent('addressDeleted', owner);
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