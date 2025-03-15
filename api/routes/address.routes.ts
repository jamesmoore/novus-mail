import { Database } from 'better-sqlite3';
import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';

export function createRouter(db: Database, domainName: string) {

    const router = Router();

    router.use(noCacheMiddleware);

    const refreshInterval = process.env.MAIL_REFRESH_INTERVAL ? Number(process.env.MAIL_REFRESH_INTERVAL) : 300;
    router.get('/addresses', (_req, res) => {
        try {
            const rows = db.prepare("SELECT addr FROM address").all();
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
            const rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
            if (rows.length > 0) {
                res.status(200).send((rows[0] as { addr: string }).addr);
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
        console.log(address);
        try {
            const rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
            if (rows.length > 0) {
                res.status(200).send();
            } else {
                db.prepare("INSERT INTO address (addr) VALUES (?)").run(address);
                console.log('returning');
                res.status(200).send();
            }
        } catch (err) {
            console.error("DB add addresses fail", err)
            res.status(500).json({ error: "Failed to add address" });
        }
    })

    router.delete('/address/:addr', (req, res) => {
        const address = req.params.addr.toLowerCase();
        try {
            db.prepare("DELETE FROM address WHERE addr = ?").run(address);
            db.prepare("DELETE FROM mail WHERE recipient = ?").run(address);
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