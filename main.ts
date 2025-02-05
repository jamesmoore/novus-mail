"use strict";
import smtpSrv from './smtpSrv'
import httpSrv from './httpSrv'
import config from './config'
import domain from './domain'
import database from './database'

config.init();
let db = database.init();
let domainName = domain.getDomainName();

smtpSrv.start(db, 25);
httpSrv.start(db, domainName, 80);
