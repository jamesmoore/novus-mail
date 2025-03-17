import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import passport from 'passport';
import { ensureLoggedOut } from 'connect-ensure-login';
import * as client from 'openid-client'
import { configuration, oidcStrategyOptions, passportConfig } from '../auth/passport-config.js';

export function createRouter() {

    const router = Router();

    router.use(noCacheMiddleware);

    // app.get('/', ensureLoggedIn('/login'), (req, res) => {
    // 	res.send(`Welcome ${req.user?.email + '/' + req.user?.sub}`)
    // })

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

    router.get('/auth/user', (req, res) => {
        res.status(200).json({
            strategy: passportConfig.strategy.name,
            email: req.user?.email,
            sub: req.user?.sub,
            isAuthenticated: req.isAuthenticated(),
        });
    })

    return router;
}