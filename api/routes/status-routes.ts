import { Router } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { DatabaseFacade } from '../database-facade.js';

export function createRouter(databaseFacade: DatabaseFacade) {

    const router = Router();
    router.use(noCacheMiddleware);
    
    router.get('/status', async (req, res) => {
        const unread = await databaseFacade.getUnreadMailsCount();
        const addresses = await databaseFacade.getAddressCount();
        res.json({
            unread: unread,
            addresses: addresses,
        });
    });

    return router;


}

export default createRouter;