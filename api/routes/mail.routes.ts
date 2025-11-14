import { Database } from 'better-sqlite3';
import { Router, Response } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { env } from '../env/env.js';

interface Mail {
    id: string;
    sender: string;
    sendername: string;
    recipient: string;
    subject: string;
    read: number;
    received: number;
    deleted: number;
}

export function createRouter(db: Database) {

    const router = Router();

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

            const directionDursorId = (json.cursorId as string) || 'lt';
            const direction = directionDursorId.substring(0, 2);
            const cursorId = directionDursorId.substring(2);

            const owner = req.user?.sub;

            const params = {
                recipient: json.addr,
                cursorId: cursorId,
                mailCount: perPage,
                owner: owner,
            };

            const comparisonOperator = direction === 'lt' ? '<' : '>';
            const whereClause = [
                json.deleted ? 'deleted = 1' : 'deleted <> 1',
                cursorId && `Id ${comparisonOperator} @cursorId`,
                json.addr && 'recipient = @recipient',
                getOwnerWhereClause(owner),
            ].filter(Boolean).join(' AND ');

            const sortOrder = direction === 'lt' ? 'DESC' : 'ASC';

            const sql = `
              SELECT id, sender, sendername, subject, read, received 
              FROM mail 
              WHERE ${whereClause}
              ORDER BY id ${sortOrder} 
              LIMIT @mailCount
            `;

            let rows = db.prepare(sql).all(params) as Mail[];

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
            const mail = getMail(id);
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
            const mail = getMail(id);
            checkMailOwnership(req.user?.sub, mail, res, () => {
                const dbResult = mail.deleted ?
                    db.prepare("DELETE FROM mail WHERE id = ?").run(id) :
                    db.prepare("UPDATE mail SET deleted = 1 WHERE id = ?").run(id);
                res.status(200).send(`Deleted ${dbResult.changes} mails`);
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
                const dbResult = db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(addr);
                res.status(200).send(`Deleted ${dbResult.changes} mails`);
            });
        } catch (err) {
            console.error("DB delete mails fail", err)
            res.status(500).json({ error: "Failed to delete mails" });
        }
    })

    router.post('/emptyDeletedMails', (req, res) => {
        try {
            const owner = req.user?.sub;

            const params = {
                owner: owner,
            };

            const whereClause = [
                'deleted = 1',
                getOwnerWhereClause(owner),
            ].filter(Boolean).join(' AND ');

            const sql = `DELETE FROM mail WHERE ${whereClause}`;

            const dbResult = db.prepare(sql).run(params);
            res.status(200).send(`Deleted ${dbResult.changes} mails`);
        } catch (err) {
            console.error("DB empty deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to empty deleted mails" });
        }
    })

    router.post('/readMail', (req, res) => {
        const json = req.body;
        try {
            const mail = getMail(json.id);
            checkMailOwnership(req.user?.sub, mail, res, () => {
                if (mail.read === 0) {
                    const dbResult = db.prepare("UPDATE mail SET read = 1 where id = ?").run(json.id);
                    res.status(200).send(`Updated ${dbResult.changes} mails as read`);
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
                const dbResult = db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(addr);
                res.status(200).send(`Marked ${dbResult.changes} mails read`);
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

            const params = {
                owner: owner,
            };

            const whereClause = [
                'read = 0',
                'deleted = 0',
                getOwnerWhereClause(owner),
            ].filter(Boolean).join(' AND ');

            const unread = db.prepare(`
                SELECT recipient, count(*) as unread
                FROM mail
                WHERE ${whereClause}
                GROUP BY recipient
                `).all(params);
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

        const addressRow = getAddress(address);

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

        const addressRow = getAddress(mail.recipient);

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

    function getAddress(address: string) {
        return db
            .prepare("SELECT owner FROM address WHERE addr = ?")
            .get(address) as { owner: string | null; } | undefined;
    }

    function getMail(id: string) {
        const rows = db.prepare("SELECT recipient, sender, sendername, subject, content, read, received, deleted FROM mail WHERE id = ?").all(id);
        const mail = rows[0] as Mail;
        return mail;
    }

    return router;
}

export default createRouter;

function getOwnerWhereClause(owner: string | undefined) {
    return owner && 'mail.recipient in (SELECT addr FROM address WHERE address.owner IS NULL OR address.owner = @owner)';
}
