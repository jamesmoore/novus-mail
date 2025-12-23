import { Database } from 'better-sqlite3';
import { Router, Response } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { env } from '../env/env.js';
import { DatabaseFacade } from '../databaseFacade.js';
import { Mail } from '../models/mail.js';

export function createRouter(db: Database) {

    const router = Router();
    const databaseFacade = new DatabaseFacade(db);

    router.use(noCacheMiddleware);

    router.post('/mails', (req, res) => {
        // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1110);

        const json = req.body as {
            cursorId: string,
            addr: string,
            deleted: boolean
        };

        try {
            const perPage = env.MAIL_COUNT_PER_PAGE;

            const directionCursorId = (json.cursorId as string) || 'lt';
            const direction = directionCursorId.substring(0, 2);
            const cursorId = directionCursorId.substring(2);

            const owner = req.user?.sub;

            let rows = databaseFacade.getMails(json.addr, json.deleted, cursorId, perPage, owner, direction);

            if (direction === 'gt') {
                rows = rows.sort((a, b) => b.id > a.id ? 1 : -1);
            }

            res.json({
                data: rows,
                nextId: (rows.length === 0 || rows.length < perPage) ? null : 'lt' + rows[rows.length - 1].id,
                previousId: rows.length === 0 ? null : 'gt' + rows[0].id,
            });

        } catch (err) {
            console.error("DB get mails fail");
            console.error(err);
            res.status(500).json({ error: "Failed to get mails" });
        }

    });

    router.get('/mail/:id', (req, res) => {
        const id = req.params.id;
        try {
            const mail = databaseFacade.getMail(id);
            checkMailOwnership(req.user?.sub, mail, res, () => {
                res.json(mail);
            });
        } catch (err) {
            console.error("DB get mail data fail", err)
            res.status(500).json({ error: "Failed to get mail" });
        }
    });

    router.delete('/mail/:id', (req, res) => {
        const id = req.params.id;
        try {
            const mail = databaseFacade.getMail(id);
            checkMailOwnership(req.user?.sub, mail, res, () => {
                const changes = mail.deleted ?
                    databaseFacade.deleteMail(id) :
                    databaseFacade.softDeleteMail(id);
                res.status(200).send(`Deleted ${changes} mails`);
            });
        } catch (err) {
            console.error("DB delete mail fail", err)
            res.status(500).json({ error: "Failed to delete mail" });
        }
    });

    router.delete('/mails/:addr', (req, res) => {
        const addr = req.params.addr;
        try {
            checkAddressOwnership(req.user?.sub, addr, res, () => {
                const changes = databaseFacade.deleteMailsForAddress(addr);
                res.status(200).send(`Deleted ${changes} mails`);
            });
        } catch (err) {
            console.error("DB delete mails fail", err)
            res.status(500).json({ error: "Failed to delete mails" });
        }
    })

    router.post('/emptyDeletedMails', (req, res) => {
        try {
            const owner = req.user?.sub;
            const changes = databaseFacade.emptyDeletedMails(owner);
            res.status(200).send(`Deleted ${changes} mails`);
        } catch (err) {
            console.error("DB empty deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to empty deleted mails" });
        }
    })

    router.post('/restoreDeletedMails', (req, res) => {
        try {
            const owner = req.user?.sub;
            const changes = databaseFacade.restoreDeletedMails(owner);
            res.status(200).send(`Restored ${changes} mails`);
        } catch (err) {
            console.error("DB restore deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to restore deleted mails" });
        }
    })    

    router.post('/readMail', (req, res) => {
        const json = req.body;
        try {
            const mail = databaseFacade.getMail(json.id);
            checkMailOwnership(req.user?.sub, mail, res, () => {
                if (mail.read === 0) {
                    const mailId = json.id;
                    const changes = databaseFacade.markMailAsRead(mailId);
                    res.status(200).send(`Updated ${changes} mails as read`);
                }
                else {
                    res.status(200).send("Mail already read");
                }
            });
        } catch (err) {
            console.error("DB update mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to update mail as read" });
        }
    })

    router.post('/readAllMail', (req, res) => {
        const addr = req.body.address;
        try {
            checkAddressOwnership(req.user?.sub, addr, res, () => {
                const changes = databaseFacade.markAllAsRead(addr);
                res.status(200).send(`Marked ${changes} mails read`);
            }
            );
        } catch (err) {
            console.error("DB read all mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to mark all mails as read" });
        }
    })

    router.get('/unreadCounts', (req, res) => {

        try {
            const owner = req.user?.sub;
            const unread = databaseFacade.getUnread(owner);
            res.json(unread);
        } catch (err) {
            console.error("unread counts select fail", err);
            res.status(500).json({ error: "Failed to get unread counts" });
        }
    })

    function checkAddressOwnership(user: string | undefined, address: string, res: Response, handle: () => void)  {
        if (!user) {
            handle();
            return;
        }

        const addressRow = databaseFacade.getAddressOwner(address);

        if (!addressRow) {
            res.status(404).send();
            return;
        }

        const { owner } = addressRow;

        if (owner !== user && owner !== null) {
            res.status(401).send();
        }
        else {
            handle();
        }
    };

    function checkMailOwnership(user: string | undefined, mail: Mail, res: Response, handle: () => void) {
        if (!mail) {
            res.status(404).send();
            return;
        }

        if (!user) {
            handle();
            return;
        }

        const addressRow = databaseFacade.getAddressOwner(mail.recipient);

        if (!addressRow) {
            res.status(404).send();
            return;
        }

        const { owner } = addressRow;

        if (owner !== user && owner !== null) {
            res.status(401).send();
        }
        else {
            handle();
        }
    };

    return router;
}

export default createRouter;

