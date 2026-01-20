"use strict";
import 'dotenv/config'; // imported directly to load .env file first
import { SMTPServer } from './smtp/smtp-server.js'
import { HttpServer } from './http-server.js'
import domain from './domain.js'
import dbinit from './db/sqlite-database-factory.js'
import WebSocketNotifier from './ws/web-socket-notifier.js';
import EventEmitter from 'events';
import postgresInit from './db/postgres-database-factory.js';
import { env } from './env/env.js';
import { MailHandler } from './smtp/mail-handler.js';

let databaseFacade;
try {
    databaseFacade = env.POSTGRES_URL ?
        await postgresInit(env.POSTGRES_URL, env.POSTGRES_LOG_SQL) :
        dbinit();
} catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
}

const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();
const mailHandler = new MailHandler(databaseFacade, notificationEventEmitter);
const smtpSrv = new SMTPServer(mailHandler, 25);
smtpSrv.start();
const httpServer = new HttpServer(databaseFacade, domainName, 80);
const server = httpServer.start();
new WebSocketNotifier(server, databaseFacade, notificationEventEmitter);
