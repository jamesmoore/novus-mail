import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function ensureCsrfToken(req: Request, _res: Response, next: NextFunction): void {
        if (req.session && !req.session.csrfToken) {
                req.session.csrfToken = crypto.randomBytes(32).toString('hex');
        }
        next();
}

export function requireCsrfToken(req: Request, res: Response, next: NextFunction): void {
        if (SAFE_METHODS.has(req.method.toUpperCase())) {
                return next();
        }

        const sessionToken = req.session?.csrfToken;
        const requestToken = req.get('x-csrf-token');

        if (!sessionToken || !requestToken) {
                res.status(403).json({ error: 'Missing CSRF token' });
                return;
        }

        try {
                const expected = Buffer.from(sessionToken, 'utf8');
                const provided = Buffer.from(requestToken, 'utf8');

                if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
                        res.status(403).json({ error: 'Invalid CSRF token' });
                        return;
                }
        } catch (_error) {
                res.status(403).json({ error: 'Invalid CSRF token' });
                return;
        }

        next();
}
