import express from 'express'
import { Database } from 'better-sqlite3';
import cors from 'cors';
import { Server } from 'http';
import { createRouter as createAddressRouter } from './routes/address.routes.js';
import { createRouter as createMailRouter } from './routes/mail.routes.js';
import { createRouter as createStatusRouter } from './routes/status.routes.js';
import { createRouter as createAuthRouter } from './routes/auth.routes.js';
import { env } from './env/env.js';
import { passportConfig } from './auth/passport-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticContentPath = './front-react/dist';

export class HttpServer {
	private db: Database;
	private port: number;
	private domainName: string;

	constructor(db: Database, domainName: string, port: number) {
		this.db = db;
		this.port = port;
		this.domainName = domainName;
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

		app.use('/', createAuthRouter());

		// app.get('/', (_req, res) => {
		// 	res.redirect('/index.html');
		// })

		// app.use(function(req,res,next){setTimeout(next,1000)});

		app.get(/\/favicon.ico|\/mail.svg/, (_req, res) => {
			res.sendFile(join(__dirname, staticContentPath, 'mail.svg'), (err) => {
				if (err) {
					res.status(500).send(err)
				}
			});
		})

		app.use(express.static(staticContentPath));

		const authMiddleware = passportConfig.middleware;
		app.use('/api', authMiddleware, createAddressRouter(this.db, this.domainName));
		app.use('/api', authMiddleware, createMailRouter(this.db));
		app.use('/api', authMiddleware, createStatusRouter(this.db));

		// catch-all handler for react router. This is needed so that urls that are refreshed activate the react router. The alternative 302 redirect to / would break that.
		// https://expressjs.com/en/guide/migrating-5.html#path-syntax
		app.get('/{*splat}', authMiddleware, (_req, res) => {
			res.sendFile(join(__dirname, staticContentPath, 'index.html'), (err) => {
				if (err) {
					res.status(500).send(err)
				}
			});
		})

		const server = app.listen(this.port, () => {
			console.log('http server listening at port: ' + this.port);
		})

		return server;
	}

}
