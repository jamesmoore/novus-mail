import { Database } from 'better-sqlite3';
import { Router } from 'express';
import { noCacheMiddleware } from './noCacheMiddleware.js';
import { env } from '../env/env.js';

interface Mail {
    id: string;
    sender: string;
    subject: string;
    read: boolean;
    received: number;
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
              SELECT id, sender, subject, read, received 
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
            // TODO#1 Check owner

            const rows = db.prepare("SELECT recipient, sender, subject, content, read, received FROM mail WHERE id = ?").all(id);
            res.json(rows[0])
        } catch (err) {
            console.error("DB get mail data fail", err)
            res.status(500).json({ error: "Failed to get mail" });
        }
    });

    router.delete('/mail/:id', (req, res) => {
        const id = req.params.id;
        try {
            // TODO#2 Check owner
            const mail = db.prepare("SELECT deleted FROM mail WHERE id = ?").get(id);
            const isDeleted = mail as unknown as { deleted: boolean };

            if (isDeleted.deleted) {
                db.prepare("DELETE FROM mail WHERE id = ?").run(id);
            }
            else {
                db.prepare("UPDATE mail SET deleted = 1 WHERE id = ?").run(id);
            }
            res.status(200).send();
        } catch (err) {
            console.error("DB delete mail fail", err)
            res.status(500).json({ error: "Failed to delete mail" });
        }
    });

    router.delete('/mails/:addr', (req, res) => {
        const addr = req.params.addr;
        try {
            const canUpdate = checkAddressOwnership(req.user?.sub, addr);
            switch (canUpdate) {
                case "ADDRESS_NOT_YOURS":
                    res.status(401).send();
                    break;
                case "ADDRESS_NOT_FOUND":
                    res.status(404).send();
                    break;
                case "OK":
                    const dbResult = db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(addr);
                    res.status(200).send(`Deleted ${dbResult.changes} email`);
            }
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
            // TODO#4 Check owner
            db.prepare("UPDATE mail SET read = 1 where id = ?").run(json.id);
            res.status(200).send();
        } catch (err) {
            console.error("DB update mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to update mail as read" });
        }
    })

    router.post('/readAllMail', (req, res) => {
        const addr = req.body.address;
        try {
            const canUpdate = checkAddressOwnership(req.user?.sub, addr);
            switch (canUpdate) {
                case "ADDRESS_NOT_YOURS":
                    res.status(401).send();
                    break;
                case "ADDRESS_NOT_FOUND":
                    res.status(404).send();
                    break;
                case "OK":
                    const dbResult = db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(addr);
                    res.status(200).send(`Marked ${dbResult.changes} read`);
            }
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

    const checkAddressOwnership = (user: string | undefined, address: string) => {
        if (!user) {
            return "OK";
        }

        const addressRow = db.prepare("SELECT owner FROM address WHERE addr = ?").get(address);
        if (addressRow) {
            const owner = (addressRow as { owner: string | null }).owner;
            if (owner !== user && owner !== null) {
                return "ADDRESS_NOT_YOURS";
            }
        } else {
            return "ADDRESS_NOT_FOUND";
        }
        return "OK";
    };

    return router;
}

export default createRouter;

function getOwnerWhereClause(owner: string | undefined) {
    return owner && 'mail.recipient in (SELECT addr FROM address WHERE address.owner IS NULL OR address.owner = @owner)';
}
