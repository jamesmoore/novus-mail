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

            const params = {
                recipient: json.addr,
                cursorId: cursorId,
                mailCount: perPage
            };

            const comparisonOperator = direction === 'lt' ? '<' : '>';
            const whereClause =
                (json.deleted ? ` deleted = 1 ` : ' deleted <> 1 ') +
                (cursorId ? ` AND Id ${comparisonOperator} @cursorId` : '') +
                (json.addr ? ` AND recipient = @recipient` : '')

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
            db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(addr);
            res.status(200).send();
        } catch (err) {
            console.error("DB delete mails fail", err)
            res.status(500).json({ error: "Failed to delete mails" });
        }
    })

    router.post('/emptyDeletedMails', (req, res) => {
        try {
            db.prepare("DELETE FROM mail WHERE deleted = 1").run();
            res.status(200).send();
        } catch (err) {
            console.error("DB empty deleted mails fail")
            console.error(err)
            res.status(500).json({ error: "Failed to empty deleted mails" });
        }
    })

    router.post('/readMail', (req, res) => {

        const json = req.body;

        try {
            db.prepare("UPDATE mail SET read = 1 where id = ?").run(json.id);
            res.status(200).send();
        } catch (err) {
            console.error("DB update mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to update mail as read" });
        }
    })

    router.post('/readAllMail', (req, res) => {

        const json = req.body;
        try {
            db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(json.address);
            res.status(200).send();
        } catch (err) {
            console.error("DB read all mail fail")
            console.error(err)
            res.status(500).json({ error: "Failed to mark all mails as read" });
        }
    })

    router.get('/unreadCounts', (req, res) => {

        try {
            const unread = db.prepare(`
                SELECT recipient, count(*) as unread
                from mail
                where read = 0 and deleted = 0
                group by recipient
                `).all();
            res.json(unread);
        } catch (err) {
            console.error("unread counts select fail", err);
            res.status(500).json({ error: "Failed to get unread counts" });
        }
    })

    return router;
}

export default createRouter;