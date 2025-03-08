import { Database } from 'better-sqlite3';
import { Router } from 'express';
import config from '../config.js';

export function createRouter(db: Database, domainName: string) {

    const router = Router();

    const refreshInterval = config.getConfig("MailRefreshInterval");
    router.post('/addresses', (_req, res) => {

        try {

            const rows = db.prepare("SELECT addr FROM address").all();
            res.json({ addresses: rows, refreshInterval: refreshInterval });

        } catch (err) {

            console.error("DB get addresses fail")
            console.error(err)
            res.status(500).send('Failed to get addresses');
        }

    })

    router.post('/domain', (req, res) => {

        if (domainName) {

            res.status(200).send(domainName);

        } else {

            res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');

        }

    });

    router.post('/getAddress', (req, res) => {
        const json = req.body;
        try {
            const address = json.address.toLowerCase();
            const rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
            if (rows.length > 0) {
                res.status(200).send((rows[0] as { addr: string }).addr);
            }
            else {
                res.status(200).send('');
            }
        } catch (err) {
            console.error("DB get addresses fail")
            console.error(err)
            res.status(500).send('Failed to get address');
        }
    })

    router.post('/addAddress', (req, res) => {

        const json = req.body;

        try {

            const address = json.address.toLowerCase();
            const rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
            if (rows.length > 0) {

                res.status(200).send("exist");

            } else {
                db.prepare("INSERT INTO address (addr) VALUES (?)").run(address);
                res.status(200).send("done");
            }

        } catch (err) {

            console.error("DB add addresses fail")
            console.error(err)
            res.status(500).json({ error: "Failed to add address" });
        }
    })

    router.post('/deleteAddress', (req, res) => {

        const json = req.body;

        try {

            db.prepare("DELETE FROM address WHERE addr = ?").run(json.address);
            db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);

            res.status(200).send("done");

        } catch (err) {
            console.error("DB delete address fail");
            console.error(err)
            res.status(500).send('Failed to delete address');
        }

    })

    return router;
}

export default createRouter;