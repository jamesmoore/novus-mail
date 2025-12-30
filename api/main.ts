"use strict";
import { SMTPServer } from './smtp-server.js'
import { HttpServer } from './http-server.js'
import domain from './domain.js'
import dbinit from './sqlite-database-factory.js'
import WebSocketNotifier from './ws/web-socket-notifier.js';
import EventEmitter from 'events';
import { SqliteDatabaseFacade } from './sqlite-database-facade.js';

const db = dbinit();
const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();


const databaseFacade = new SqliteDatabaseFacade(db);
const smtpSrv = new SMTPServer(databaseFacade, 25, notificationEventEmitter);
smtpSrv.start();
const httpServer = new HttpServer(databaseFacade, domainName, 80);
const server = httpServer.start();
new WebSocketNotifier(server, databaseFacade, notificationEventEmitter);
