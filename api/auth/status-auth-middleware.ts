import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { DatabaseFacade } from '../db/database-facade.js';
import { ApiKeyService } from './api-key-service.js';
import { ApiKeyStrategy } from './api-key-strategy.js';
import { authMode } from './passport-config.js';

export function configureStatusAuthentication(database: DatabaseFacade) {
    passport.use(new ApiKeyStrategy(new ApiKeyService(database)));
}

export function statusAuthenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    if (authMode === 'anonymous') {
        req.authPrincipal = { authType: 'anonymous', accessMode: 'global' };
        return next();
    }

    if (req.isAuthenticated() && req.user?.sub) {
        req.authPrincipal = {
            authType: 'oidc',
            accessMode: 'owner',
            owner: req.user.sub,
        };
        return next();
    }

    passport.authenticate('api-key', { session: false }, (error: unknown, user?: Express.User | false) => {
        if (error) {
            return next(error);
        }
        if (!user || user.authType !== 'api-key' || !user.accessMode) {
            return res.status(401).send();
        }

        req.authPrincipal = {
            authType: 'api-key',
            accessMode: user.accessMode,
            owner: user.owner,
            apiKeyId: user.apiKeyId,
        };
        return next();
    })(req, res, next);
}
