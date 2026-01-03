"use strict";
import { SMTPServer } from './smtp-server.js'
import { HttpServer } from './http-server.js'
import domain from './domain.js'
import dbinit from './sqlite-database-factory.js'
import WebSocketNotifier from './ws/web-socket-notifier.js';
import EventEmitter from 'events';
import postgresInit from './postgres-database-factory.js';
import { env } from './env/env.js';

let databaseFacade;
try {
    databaseFacade = env.POSTGRES_URL ?
        await postgresInit(env.POSTGRES_URL) :
        dbinit();
} catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
}

const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();

const smtpSrv = new SMTPServer(databaseFacade, 25, notificationEventEmitter);
smtpSrv.start();
const httpServer = new HttpServer(databaseFacade, domainName, 80);
const server = httpServer.start();
new WebSocketNotifier(server, databaseFacade, notificationEventEmitter);
