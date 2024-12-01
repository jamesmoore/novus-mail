"use strict";
import smtpSrv from './smtpSrv.js'
import httpSrv from './httpSrv.js'
import config from './config.js'
import domain from './domain.js'
import database from './database.js'

config.init();
let db = database.init();
let domainName = domain.getDomainName();

smtpSrv.start(db, 25);
httpSrv.start(db, domainName, 80);
