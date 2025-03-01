"use strict";
import smtpSrv from './smtpSrv.js'
import httpSrv from './httpSrv.js'
import config from './config.js'
import domain from './domain.js'
import database from './database.js'
import WebSocketNotifier from './WebSocketNotifier.js';
import EventEmitter from 'events';

config.init();
const db = database.init();
const domainName = domain.getDomainName();

const notificationEventEmitter = new EventEmitter();

smtpSrv.start(db, 25, notificationEventEmitter);
const server = httpSrv.start(db, domainName, 80);
new WebSocketNotifier(server, notificationEventEmitter);
