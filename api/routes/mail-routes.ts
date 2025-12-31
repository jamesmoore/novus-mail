import { Router, Response } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { env } from '../env/env.js';
import { DatabaseFacade } from '../database-facade.js';
import { Mail } from '../models/mail.js';

export function createRouter(databaseFacade: DatabaseFacade) {

    const router = Router();

    router.use(noCacheMiddleware);

    router.post('/mails', async (req, res) => {
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

            let rows = await databaseFacade.getMails(json.addr, json.deleted, cursorId, perPage, owner, direction);

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

    router.get('/mail/:id', async (req, res) => {
        const id = req.params.id;
        try {
            const mail = await databaseFacade.getMail(id);
            if (!mail) {
                res.sendStatus(404);
                return;
            }
            await checkMailOwnership(req.user?.sub, mail, res, async () => {
                res.json(mail);
            });
        } catch (err) {
            console.error("DB get mail data fail", err)
            res.status(500).json({ error: "Failed to get mail" });
        }
    });

    router.delete('/mail/:id', async (req, res) => {
        const id = req.params.id;
        try {
            const mail = await databaseFacade.getMail(id);
            if (!mail) {
                res.sendStatus(404);
                return;
            }
            await checkMailOwnership(req.user?.sub, mail, res, async () => {
                const changes = mail.deleted ?
                    await databaseFacade.deleteMail(id) :
                    await databaseFacade.softDeleteMail(id);
                res.status(200).send(`Deleted ${changes} mails`);
            });
        } catch (err) {
            console.error("DB delete mail fail", err)
            res.status(500).json({ error: "Failed to delete mail" });
        }
    });

    router.delete('/mails/:addr', async (req, res) => {
        const addr = req.params.addr;
        try {
            await checkAddressOwnership(req.user?.sub, addr, res, async () => {
                const changes = await databaseFacade.deleteMailsForAddress(addr);
                res.status(200).send(`Deleted ${changes} mails`);
            });
        } catch (err) {
            console.error("DB delete mails fail", err)
            res.status(500).json({ error: "Failed to delete mails" });
        }
    })

    router.post('/emptyDeletedMails', async (req, res) => {
        try {
            const owner = req.user?.sub;
            const changes = await databaseFacade.emptyDeletedMails(owner);
            res.status(200).send(`Deleted ${changes} mails`);
        } catch (err) {
            console.error("DB empty deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to empty deleted mails" });
        }
    })

    router.post('/restoreDeletedMails', async (req, res) => {
        try {
            const owner = req.user?.sub;
            const changes = await databaseFacade.restoreDeletedMails(owner);
            res.status(200).send(`Restored ${changes} mails`);
        } catch (err) {
            console.error("DB restore deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to restore deleted mails" });
        }
    })

    router.post('/readMail', async (req, res) => {
        const json = req.body;
        try {
            const mail = await databaseFacade.getMail(json.id);
            if (!mail) {
                res.sendStatus(404);
                return;
            }
            await checkMailOwnership(req.user?.sub, mail, res, async () => {
                if (mail.read === 0) {
                    const mailId = json.id;
                    const changes = await databaseFacade.markMailAsRead(mailId);
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

    router.post('/readAllMail', async (req, res) => {
        const addr = req.body.address;
        try {
            await checkAddressOwnership(req.user?.sub, addr, res, async () => {
                const changes = await databaseFacade.markAllAsRead(addr);
                res.status(200).send(`Marked ${changes} mails read`);
            }
            );
        } catch (err) {
            console.error("DB read all mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to mark all mails as read" });
        }
    })

    router.get('/unreadCounts', async (req, res) => {

        try {
            const owner = req.user?.sub;
            const unread = await databaseFacade.getUnread(owner);
            res.json(unread);
        } catch (err) {
            console.error("unread counts select fail", err);
            res.status(500).json({ error: "Failed to get unread counts" });
        }
    })

    async function checkAddressOwnership(user: string | undefined, address: string, res: Response, handle: () => Promise<void>) {
        if (!user) {
            handle();
            return;
        }

        const addressRow = await databaseFacade.getAddress(address);

        if (!addressRow) {
            res.status(404).send();
            return;
        }

        const { owner } = addressRow;

        if (owner !== user && owner !== null) {
            res.status(401).send();
        }
        else {
            await handle();
        }
    };

    async function checkMailOwnership(user: string | undefined, mail: Mail, res: Response, handle: () => Promise<void>) {
        if (!mail) {
            res.status(404).send();
            return;
        }

        if (!user) {
            handle();
            return;
        }

        const addressRow = await databaseFacade.getAddress(mail.recipient);

        if (!addressRow) {
            res.status(404).send();
            return;
        }

        const { owner } = addressRow;

        if (owner !== user && owner !== null) {
            res.status(401).send();
        }
        else {
            await handle();
        }
    };

    return router;
}

export default createRouter;

