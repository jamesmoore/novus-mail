import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import passport from 'passport';
import { ensureLoggedOut } from 'connect-ensure-login';
import * as client from 'openid-client'
import { configuration, oidcStrategyOptions, passportConfig } from '../auth/passport-config.js';
import cookieParser from 'cookie-parser';
import { env } from '../env/env.js';
import session from 'express-session';
// @ts-expect-error missing types - no @types/connect-loki package
import LokiStore from 'connect-loki';
import { ensureCsrfToken } from './csrf.middleware.js';

export function createRouter() {

    const lokiStore = LokiStore(session);

    const router = Router();

    router.use(noCacheMiddleware);

    router.use(cookieParser())
    router.use(
        (session as unknown as (options?: any) => any)({
            saveUninitialized: false,
            resave: true,
            secret: env.SESSION_SECRET,
            store: new lokiStore({
                ttl: 3600 * 24 * 7,
                path: './data/session-store.db',
            }),
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true,
            },
        })
    )
    router.use(ensureCsrfToken);
    router.use(passport.initialize());
    router.use(passport.session());
    router.use(passport.authenticate('session'))

    console.log('Using passport strategy: ' + passportConfig.strategy.name);
    passport.use(passportConfig.strategy)

    passport.serializeUser((user: Express.User, cb) => {
        cb(null, user)
    })

    passport.deserializeUser((user: Express.User, cb) => {
        return cb(null, user)
    })

    router.get(
        '/login',
        ensureLoggedOut('/logout'),
        passport.authenticate(passportConfig.strategy)
    )

    router.get('/logout', (req, res) => {
        const endSessionUrl = () => {
            try {
                return client.buildEndSessionUrl(configuration, {
                    post_logout_redirect_uri: `${req.protocol}://${req.host}`,
                }).href;
            } catch (error) {
                console.error('Error building end session URL:', error);
                return '';
            }
        }

        req.logout(() => { });
        res.status(200).json({
            logoutUrl: endSessionUrl(),
        });
    })

    router.get(
        '/auth/callback',
        passport.authenticate(oidcStrategyOptions.name!, {
            successRedirect: '/',  // Redirect after successful login
            failureRedirect: '/login',  // Redirect after failure
        }),
        (req, res) => {
            res.redirect('/');
        }
    );

    router.get('/auth/csrf-token', (req, res) => {
        res.status(200).json({
            csrfToken: req.session?.csrfToken,
        });
    })

    router.get('/auth/user', (req, res) => {
        res.status(200).json({
            strategy: passportConfig.strategy.name,
            email: req.user?.email,
            sub: req.user?.sub,
            picture: req.user?.picture,
            isAuthenticated: req.isAuthenticated(),
        });
    })

    return router;
}