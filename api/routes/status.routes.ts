import { Database } from 'better-sqlite3';
import { Router } from 'express';

export function createRouter(db: Database) {

    const router = Router();

    router.post('/status', (req, res) => {
        const unread = db.prepare('SELECT count(*) as unread from mail where read = 0').get();
        const addresses = db.prepare('SELECT count(*) as addresses from address').get();
        res.json({
            unread: (unread as { unread: number }).unread,
            addresses: (addresses as { addresses: number }).addresses,
        });
    });

    return router;
}

export default createRouter;