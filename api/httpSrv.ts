import express from 'express'
import { Database } from 'better-sqlite3';
import cors from 'cors';
import { Server } from 'http';
import { createRouter as createAddressRouter } from './routes/address.routes.js';
import { createRouter as createMailRouter } from './routes/mail.routes.js';
import { createRouter as createStatusRouter } from './routes/status.routes.js';
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

		app.use(express.json());

		app.use((req, res, next) => {
			res.set('Referrer-Policy', 'no-referrer');
			next();
		});

		app.use(express.static(staticContentPath));

		if (process.env.CORS_ALLOW_ALL_ORIGINS == "true") {
			console.info("CORS: Allowing all origins");
			app.use(cors());
		}


		// app.get('/', (_req, res) => {
		// 	res.redirect('/index.html');
		// })

		// app.use(function(req,res,next){setTimeout(next,1000)});

		app.use('/', createAddressRouter(this.db, this.domainName));
		app.use('/', createMailRouter(this.db));
		app.use('/', createStatusRouter(this.db));

		// catch-all handler for react router
		app.get('*', (_req, res) => {
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
