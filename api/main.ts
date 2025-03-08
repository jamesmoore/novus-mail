"use strict";
import { SMTPServer } from './smtpSrv.js'
import { HttpServer } from './httpSrv.js'
import config from './config.js'
import domain from './domain.js'
import database from './database.js'
import WebSocketNotifier from './WebSocketNotifier.js';
import EventEmitter from 'events';

config.init();
const db = database.init();
const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();


const smtpSrv = new SMTPServer(db, 25,notificationEventEmitter);
smtpSrv.start();
const httpServer = new HttpServer(db, domainName, 80);
const server = httpServer.start();
new WebSocketNotifier(server, notificationEventEmitter);
