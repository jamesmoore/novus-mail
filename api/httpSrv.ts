import express from 'express'
import { Database } from 'better-sqlite3';
import cors from 'cors';
import { Server } from 'http';
import { createRouter as createAddressRouter } from './routes/address.routes.js';
import { createRouter as createMailRouter } from './routes/mail.routes.js';
import { createRouter as createStatusRouter } from './routes/status.routes.js';
import { createRouter as createAuthRouter } from './routes/auth.routes.js';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { env } from './env/env.js';
import { passportConfig } from './auth/passport-config.js';
// @ts-expect-error missing types - no @types/connect-loki package
import LokiStore from 'connect-loki';

const lokiStore = LokiStore(session);

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

		app.set('trust proxy',true);

		app.use(cookieParser())
		app.use(
			session({
				saveUninitialized: false,
				resave: true,
				secret: env.SESSION_SECRET,
				store: new lokiStore({
					ttl: 3600 * 24 * 7,
					path: './data/session-store.db',
				}) as session.Store,
				cookie: {
					secure: process.env.NODE_ENV === 'production',
				},
			}),
		)
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(passport.authenticate('session'))

		console.log('Using passport strategy: ' + passportConfig.strategy.name);
		passport.use(passportConfig.strategy)

		passport.serializeUser((user: Express.User, cb) => {
			cb(null, user)
		})

		passport.deserializeUser((user: Express.User, cb) => {
			return cb(null, user)
		})

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

		const authMiddleware = passportConfig.middleware;

		// app.get('/', (_req, res) => {
		// 	res.redirect('/index.html');
		// })

		// app.use(function(req,res,next){setTimeout(next,1000)});

		app.use(authMiddleware, express.static(staticContentPath));

		app.use('/api', authMiddleware, createAddressRouter(this.db, this.domainName));
		app.use('/api', authMiddleware, createMailRouter(this.db));
		app.use('/api', authMiddleware, createStatusRouter(this.db));

		// catch-all handler for react router
		app.get('*', authMiddleware, (_req, res) => {
			res.redirect('/');
			// res.sendFile(join(__dirname, staticContentPath, 'index.html'), (err) => {
			// 	if (err) {
			// 		res.status(500).send(err)
			// 	}
			// });
		})

		const server = app.listen(this.port, () => {
			console.log('http server listening at port: ' + this.port);
		})

		return server;
	}

}
