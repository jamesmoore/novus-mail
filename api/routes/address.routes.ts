import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { env } from '../env/env.js';
import { DatabaseFacade } from '../databaseFacade.js';

export function createRouter(databaseFacade: DatabaseFacade, domainName: string) {

    const router = Router();

    router.use(noCacheMiddleware);

    const refreshInterval = env.MAIL_REFRESH_INTERVAL;
    router.get('/addresses', (req, res) => {
        try {
            const sub = req.user?.sub;
            const rows = databaseFacade.getAddresses(sub);
            res.json({ addresses: rows, refreshInterval: refreshInterval });
        } catch (err) {
            console.error("DB get addresses fail", err);
            res.status(500).send('Failed to get addresses');
        }
    });

    router.get('/domain', (req, res) => {
        if (domainName) {
            res.status(200).send(domainName);
        } else {
            res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');
        }
    });

    router.get('/address/:addr', (req, res) => {
        const address = req.params.addr.toLowerCase();
        try {
            const addressRow = databaseFacade.getAddress(address);
            if (addressRow) {
                res.status(200).send((addressRow as { addr: string }).addr);
            } else {
                res.status(404).send('Address not found');
            }
        } catch (err) {
            console.error("DB get addresses fail", err);
            res.status(500).send('Failed to retrieve address');
        }
    });

    router.put('/address/:addr', (req, res) => {
        const address = req.params.addr.toLowerCase();
        try {
            const existing = databaseFacade.getAddress(address);
            if (existing) {
                res.status(200).send();
            } else {
                databaseFacade.addAddress(address);
                res.status(200).send();
            }
        } catch (err) {
            console.error("DB add addresses fail", err)
            res.status(500).json({ error: "Failed to add address" });
        }
    })

    router.post('/address/:addr', (req, res) => {
        const address = req.params.addr.toLowerCase();

        try {
            const addressRow = databaseFacade.getAddress(address);
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
        } catch (err) {
            console.error("DB update addresses fail", err)
            res.status(500).json({ error: "Failed to update address" });
        }

        const json = req.body as {
            private: boolean,
        };

        const owner = json.private ? req.user?.sub : null;
        try {
            databaseFacade.updateAddressOwner(owner, address);
            res.status(200).send();
        } catch (err) {
            console.error("DB update addresses fail", err)
            res.status(500).json({ error: "Failed to update address" });
        }
    })

    router.delete('/address/:addr', (req, res) => {
        const address = req.params.addr.toLowerCase();
        try {
            const addressRow = databaseFacade.getAddress(address);
            if (!addressRow) {
                res.status(404).send('Address not found');
                return;
            }

            const owner = addressRow.owner;
            if (owner && owner !== req.user?.sub) {
                res.status(401).send('Address not yours');
                return;
            }

            databaseFacade.deleteAddress(address);
            res.status(200).send();
        } catch (err) {
            console.error("DB delete address fail");
            console.error(err)
            res.status(500).send('Failed to delete address');
        }
    })

    return router;
}

export default createRouter;