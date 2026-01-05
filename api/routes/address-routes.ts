import { Router, Response } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { DatabaseFacade } from '../database-facade.js';
import { Address } from '../models/address.js';

export function createRouter(databaseFacade: DatabaseFacade, domainName: string) {

    const router = Router();

    router.use(noCacheMiddleware);

    router.get('/addresses', async (req, res) => {
        const sub = req.user?.sub;
        const rows = await databaseFacade.getAddresses(sub);
        res.json({ addresses: rows });
    });

    router.get('/domain', (req, res) => {
        if (domainName) {
            res.status(200).send(domainName);
        } else {
            res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');
        }
    });

    router.get('/address/:addr', async (req, res) => {
        await checkAddressPresence(req.params.addr, res, async (address: Address) => {
            res.status(200).send(address.addr);
        });
    });

    router.put('/address/:addr', async (req, res) => {
        const address = req.params.addr.toLowerCase();
        const existing = await databaseFacade.getAddress(address);
        if (existing) {
            res.sendStatus(200);
        } else {
            await databaseFacade.addAddress(address);
            res.sendStatus(200);
        }
    });

    router.post('/address/:addr', async (req, res) => {
        await checkAddressOwnership(req.params.addr, req.user?.sub, res, async (address: Address) => {
            const json = req.body as {
                private: boolean,
            };

            const owner = json.private ? req.user?.sub : null;
            await databaseFacade.updateAddressOwner(address.addr, owner);
            res.sendStatus(200);
        });
    });

    router.delete('/address/:addr', async (req, res) => {
        await checkAddressOwnership(req.params.addr, req.user?.sub, res, async (address: Address) => {
            await databaseFacade.deleteAddress(address.addr);
            res.sendStatus(200);
        });
    });

    async function checkAddressOwnership(addr: string, sub: string | undefined, res: Response, handle: (address: Address) => Promise<void>) {
        await checkAddressPresence(addr, res, async (address: Address) => {
            const owner = address.owner;
            if (owner && owner !== sub) {
                res.status(401).send('Address not yours');
                return;
            }
            await handle(address);
        });
    }

    async function checkAddressPresence(addr: string, res: Response, handle: (address: Address) => Promise<void>) {
        const addressLower = addr.toLowerCase();
        const address = await databaseFacade.getAddress(addressLower);
        if (!address) {
            res.status(404).send('Address not found');
            return;
        }
        await handle(address);
    }

    return router;
}

export default createRouter;