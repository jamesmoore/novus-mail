import { Router, Response } from 'express';
import { noCacheMiddleware } from './no-cache-middleware.js';
import { env } from '../env/env.js';
import { DatabaseFacade } from '../db/database-facade.js';
import { Mail } from '../models/mail.js';
import { NotificationEmitter } from '../events/notification-emitter.js';

export function createRouter(databaseFacade: DatabaseFacade, notificationEmitter?: NotificationEmitter) {

    const router = Router();

    router.use(noCacheMiddleware);

    router.post('/mails', async (req, res) => {
        // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1110);

        const json = req.body as {
            cursorId: string,
            addr: string,
            deleted: boolean
        };

        const perPage = env.MAIL_COUNT_PER_PAGE;

        const directionCursorId = json.cursorId || 'lt';
        const direction = directionCursorId.substring(0, 2);
        const cursorId = directionCursorId.substring(2);

        const owner = req.user?.sub;

        const rows = await databaseFacade.getMails(json.addr, json.deleted ?? false, cursorId, perPage, owner, direction);

        if (direction === 'gt') {
            // When paginating backwards, the database returns rows in ASC order.
            // Reverse them so the UI always sees mails in DESC (newest-first) order.
            rows.reverse();
        }
        res.json({
            mails: rows,
            nextId: (rows.length === 0 || rows.length < perPage) ? null : 'lt' + rows[rows.length - 1].id,
            previousId: rows.length === 0 ? null : 'gt' + rows[0].id,
        });

    });

    router.get('/mail/:id', async (req, res) => {
        const id = req.params.id;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await checkMailOwnership(req.user?.sub, id, res, async (mail, _) => {
            res.json(mail);
        });
    });

    router.delete('/mail/:id', async (req, res) => {
        const id = req.params.id;
        await checkMailOwnership(req.user?.sub, id, res, async (mail, address) => {
            const changes = mail.deleted ?
                await databaseFacade.deleteMail(id) :
                await databaseFacade.softDeleteMail(id);
            res.status(200).send(`Deleted ${changes} mails`);
            if (changes > 0) {
                const eventType = mail.deleted ? 'hardDeleted' : 'softDeleted';
                notificationEmitter?.emit(eventType, address);
            }
        });
    });

    router.delete('/mails/:addr', async (req, res) => {
        const addr = req.params.addr;
        await checkAddressOwnership(req.user?.sub, addr, res, async () => {
            const changes = await databaseFacade.deleteMailsForAddress(addr);
            res.status(200).send(`Deleted ${changes} mails`);
            if (changes > 0) {
                notificationEmitter?.emit('softDeleted', addr);
            }
        });
    })

    router.post('/emptyDeletedMails', async (req, res) => {
        const owner = req.user?.sub;
        const changes = await databaseFacade.emptyDeletedMails(owner);
        res.status(200).send(`Deleted ${changes} mails`);
        if (changes > 0) {
            notificationEmitter?.emit('binEmptied', owner);
        }
    })

    router.post('/restoreDeletedMails', async (req, res) => {
        const owner = req.user?.sub;
        const changes = await databaseFacade.restoreDeletedMails(owner);
        res.status(200).send(`Restored ${changes} mails`);
        if (changes > 0) {
            notificationEmitter?.emit('binRestored', owner);
        }
    })

    router.post('/readMail', async (req, res) => {
        const json = req.body;
        await checkMailOwnership(req.user?.sub, json.id, res, async (mail, address) => {
            if (mail.read === false) {
                const mailId = json.id;
                const changes = await databaseFacade.markMailAsRead(mailId);
                res.status(200).send(`Updated ${changes} mails as read`);
                if (changes > 0) {
                    notificationEmitter?.emit('read', address);
                }
            }
            else {
                res.status(200).send("Mail already read");
            }
        });
    })

    router.post('/readAllMail', async (req, res) => {
        const addr = req.body.address;
        await checkAddressOwnership(req.user?.sub, addr, res, async () => {
            const changes = await databaseFacade.markAllAsRead(addr);
            res.status(200).send(`Marked ${changes} mails read`);
            if (changes > 0) {
                notificationEmitter?.emit('read', addr);
            }
        }
        );
    })

    router.get('/unreadCounts', async (req, res) => {
        const owner = req.user?.sub;
        const unread = await databaseFacade.getUnread(owner);
        res.json(unread);
    })

    async function checkAddressOwnership(user: string | undefined, address: string, res: Response, handle: () => Promise<void>) {
        if (!user) {
            await handle();
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

    async function checkMailOwnership(user: string | undefined, id: string, res: Response, handle: (mail: Mail, address: string) => Promise<void>) {
        const mail = await databaseFacade.getMail(id);
        if (!mail) {
            res.sendStatus(404);
            return;
        }

        await checkAddressOwnership(user, mail.recipient, res, async () => {
            await handle(mail, mail.recipient);
        });
    };

    return router;
}

export default createRouter;

