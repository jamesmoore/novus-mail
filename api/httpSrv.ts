import express from 'express'
import { Database } from 'better-sqlite3';
import cors from 'cors';
import { Server } from 'http';
import { createRouter as createAddressRouter } from './routes/address.routes.js';
import { createRouter as createMailRouter } from './routes/mail.routes.js';
import { createRouter as createStatusRouter } from './routes/status.routes.js';
import { createRouter as createAuthRouter } from './routes/auth.routes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { configuration, oidcStrategyOptions } from './auth/passport-config.js';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { Strategy, type VerifyFunction } from './auth/openid-client-passport.js';
import { ensureLoggedIn, ensureLoggedOut } from 'connect-ensure-login'

// @ts-expect-error missing types - no @types/connect-loki package
import LokiStore from 'connect-loki';

const lokiStore = LokiStore(session);

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

		const sessionSecret = process.env.SESSION_SECRET ?? "342b4b79-9d2d-49cc-851a-7e3e48fd2efd";

		app.use(cookieParser())
		app.use(
			session({
				saveUninitialized: false,
				resave: true,
				secret: sessionSecret,
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
		const verify: VerifyFunction = (tokens, verified) => {
			verified(null, tokens.claims())
		}

		console.log('options');
		console.log(oidcStrategyOptions);
		const strategy = new Strategy(oidcStrategyOptions, verify);
		passport.use(strategy)

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

		if (process.env.CORS_ALLOW_ALL_ORIGINS == "true") {
			console.info("CORS: Allowing all origins");
			app.use(cors());
		}

		app.use('/', createAuthRouter());

		// app.get('/', (_req, res) => {
		// 	res.redirect('/index.html');
		// })

		// app.use(function(req,res,next){setTimeout(next,1000)});

		app.use(ensureLoggedIn('/login'), express.static(staticContentPath));

		app.use('/api', ensureLoggedIn('/login'), createAddressRouter(this.db, this.domainName));
		app.use('/api', ensureLoggedIn('/login'), createMailRouter(this.db));
		app.use('/api', ensureLoggedIn('/login'), createStatusRouter(this.db));

		// catch-all handler for react router
		app.get('*', ensureLoggedIn('/login'), (_req, res) => {
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
