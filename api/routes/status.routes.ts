import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { DatabaseFacade } from '../databaseFacade.js';

export function createRouter(databaseFacade: DatabaseFacade) {

    const router = Router();
    router.use(noCacheMiddleware);
    
    router.get('/status', (req, res) => {
        const unread = databaseFacade.getUnreadMailsCount();
        const addresses = databaseFacade.getAddressCount();
        res.json({
            unread: (unread as { unread: number }).unread,
            addresses: (addresses as { addresses: number }).addresses,
        });
    });

    return router;


}

export default createRouter;