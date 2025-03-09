import { NextFunction, Request, Response } from 'express';

export const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.set('Pragma', 'no-cache'); // Backwards compatibility with older clients
    }
    next();
};