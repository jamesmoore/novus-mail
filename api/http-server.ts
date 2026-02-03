import express from 'express'
import cors from 'cors';
import { Server } from 'http';
import { createRouter as createAddressRouter } from './routes/address-routes.js';
import { createRouter as createMailRouter } from './routes/mail-routes.js';
import { createRouter as createStatusRouter } from './routes/status-routes.js';
import { createRouter as createAuthRouter } from './routes/auth-routes.js';
import { createRouter as createExportRouter } from './routes/export-routes.js';
import { env } from './env/env.js';
import { passportConfig } from './auth/passport-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseFacade } from './db/database-facade.js';
import { NotificationEmitter } from './events/notification-emitter.js';
import { errorCatchMiddleware } from './routes/error-catch-middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the frontend dist directory relative to *this file*
const frontendDistPath = join(__dirname, '..', 'front-react', 'dist');

export class HttpServer {
	private db: DatabaseFacade;
	private port: number;
	private domainName: string;
	private notificationEmitter: NotificationEmitter;

	constructor(db: DatabaseFacade, domainName: string, port: number, notificationEmitter: NotificationEmitter) {
		this.db = db;
		this.port = port;
		this.domainName = domainName;
		this.notificationEmitter = notificationEmitter;
	}

	public start(): Server {

		const app = express();

		app.set('trust proxy', env.TRUST_PROXY);

		app.use(express.json());

		app.use((req, res, next) => {
			res.set('Referrer-Policy', 'no-referrer');
			next();
		});

		if (env.CORS_ALLOW_ALL_ORIGINS) {
			console.info("CORS: Allowing all origins");
			app.use(cors());
		}

		// app.use(function(req,res,next){setTimeout(next,5000)});

		app.use('/', createAuthRouter());

		app.use(express.static(frontendDistPath));
		app.use('/api', createStatusRouter(this.db));

		const authMiddleware = passportConfig.middleware;
		app.use('/api', authMiddleware, createAddressRouter(this.db, this.domainName));
		app.use('/api', authMiddleware, createMailRouter(this.db, this.notificationEmitter));
		app.use('/api', authMiddleware, createExportRouter(this.db));

		app.use(errorCatchMiddleware);
		// catch-all handler for react router. This is needed so that urls that are refreshed activate the react router. The alternative 302 redirect to / would break that.
		// https://expressjs.com/en/guide/migrating-5.html#path-syntax
		app.get('/{*splat}', (_req, res) => {
			res.sendFile(join(frontendDistPath, 'index.html'), (err) => {
				if (err) {
					res.status(500).send(err);
				}
			});
		});

		const server = app.listen(this.port, () => {
			console.log('http server listening at port: ' + this.port);
		})

		return server;
	}

}
