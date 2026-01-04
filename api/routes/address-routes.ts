import { Router } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { env } from '../env/env.js';
import { DatabaseFacade } from '../database-facade.js';

export function createRouter(databaseFacade: DatabaseFacade, domainName: string) {

    const router = Router();

    router.use(noCacheMiddleware);

    const refreshInterval = env.MAIL_REFRESH_INTERVAL;
    router.get('/addresses', async (req, res) => {
        const sub = req.user?.sub;
        const rows = await databaseFacade.getAddresses(sub);
        res.json({ addresses: rows, refreshInterval: refreshInterval });
    });

    router.get('/domain', (req, res) => {
        if (domainName) {
            res.status(200).send(domainName);
        } else {
            res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');
        }
    });

    router.get('/address/:addr', async (req, res) => {
        const address = req.params.addr.toLowerCase();
        const addressRow = await databaseFacade.getAddress(address);
        if (addressRow) {
            res.status(200).send(addressRow.addr);
        } else {
            res.status(404).send('Address not found');
        }
    });

    router.put('/address/:addr', async (req, res) => {
        const address = req.params.addr.toLowerCase();
        const existing = await databaseFacade.getAddress(address);
        if (existing) {
            res.status(200).send();
        } else {
            await databaseFacade.addAddress(address);
            res.status(200).send();
        }
    })

    router.post('/address/:addr', async (req, res) => {
        const address = req.params.addr.toLowerCase();

        const addressRow = await databaseFacade.getAddress(address);
        if (addressRow) {
            const owner = addressRow.owner;
            if (owner !== req.user?.sub && owner !== null) {
                res.status(401).send('Address not yours');
                return;
            }
        } else {
            res.status(404).send('Address not found');
            return;
        }

        const json = req.body as {
            private: boolean,
        };

        const owner = json.private ? req.user?.sub : null;
        await databaseFacade.updateAddressOwner(address, owner);
        res.status(200).send();
    })

    router.delete('/address/:addr', async (req, res) => {
        const address = req.params.addr.toLowerCase();
        const addressRow = await databaseFacade.getAddress(address);
        if (!addressRow) {
            res.status(404).send('Address not found');
            return;
        }

        const owner = addressRow.owner;
        if (owner && owner !== req.user?.sub) {
            res.status(401).send('Address not yours');
            return;
        }

        await databaseFacade.deleteAddress(address);
        res.status(200).send();
    })

    return router;
}

export default createRouter;