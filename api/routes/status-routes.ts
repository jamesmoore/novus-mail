import { Router } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { DatabaseFacade } from '../db/database-facade.js';
import { statusAuthenticationMiddleware } from '../auth/status-auth-middleware.js';
import { RequestHandler } from 'express';

export function createRouter(
    databaseFacade: DatabaseFacade,
    authenticateStatus: RequestHandler = statusAuthenticationMiddleware,
) {

    const router = Router();
    router.use(noCacheMiddleware);

    router.get('/status', authenticateStatus, async (req, res) => {
        const owner = req.authPrincipal?.accessMode === 'owner' ? req.authPrincipal.owner : undefined;
        const unread = await databaseFacade.getUnreadMailsCount(owner);
        const addresses = await databaseFacade.getAddressCount(owner);
        res.json({
            unread: unread,
            addresses: addresses,
        });
    });

    router.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    return router;


}

export default createRouter;
