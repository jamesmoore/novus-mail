"use strict";
import { SMTPServer } from './smtpSrv.js'
import { HttpServer } from './httpSrv.js'
import domain from './domain.js'
import database from './database.js'
import WebSocketNotifier from './ws/webSocketNotifier.js';
import EventEmitter from 'events';
import { DatabaseFacade } from './databaseFacade.js';

const db = database.init();
const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();


const databaseFacade = new DatabaseFacade(db);
const smtpSrv = new SMTPServer(databaseFacade, 25, notificationEventEmitter);
smtpSrv.start();
const httpServer = new HttpServer(databaseFacade, domainName, 80);
const server = httpServer.start();
new WebSocketNotifier(server, databaseFacade, notificationEventEmitter);
