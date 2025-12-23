import { Database } from "better-sqlite3";
import { Mail } from "./models/mail.js";

export class DatabaseFacade {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    // Address
    public getAddressOwner(address: string) {
        return this.db
            .prepare("SELECT owner FROM address WHERE addr = ?")
            .get(address) as { owner: string | null; } | undefined;
    }

    // Mails
    public getMail(id: string) {
        const rows = this.db.prepare("SELECT recipient, sender, sendername, subject, content, read, received, deleted FROM mail WHERE id = ?").all(id);
        const mail = rows[0] as Mail;
        return mail;
    }

    public getMails(addr: string, deleted: boolean, cursorId: string, perPage: number, owner: string | undefined, direction: string) {
        const params = {
            recipient: addr,
            cursorId: cursorId,
            mailCount: perPage,
            owner: owner,
        };

        const comparisonOperator = direction === 'lt' ? '<' : '>';
        const whereClause = [
            deleted ? 'deleted = 1' : 'deleted <> 1',
            cursorId && `Id ${comparisonOperator} @cursorId`,
            addr && 'recipient = @recipient',
            this.getOwnerWhereClause(owner),
        ].filter(Boolean).join(' AND ');

        const sortOrder = direction === 'lt' ? 'DESC' : 'ASC';

        const sql = `
              SELECT id, sender, sendername, subject, read, received 
              FROM mail 
              WHERE ${whereClause}
              ORDER BY id ${sortOrder} 
              LIMIT @mailCount
            `;

        const rows = this.db.prepare(sql).all(params) as Mail[];
        return rows;
    }

    // Unread
    public getUnread(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = [
            'read = 0',
            'deleted = 0',
            this.getOwnerWhereClause(owner),
        ].filter(Boolean).join(' AND ');

        const unread = this.db.prepare(`
                SELECT recipient, count(*) as unread
                FROM mail
                WHERE ${whereClause}
                GROUP BY recipient
                `).all(params);
        return unread;
    }

    public markMailAsRead(mailId: string) {
        const result = this.db.prepare("UPDATE mail SET read = 1 where id = ?").run(mailId);
        return result.changes;
    }

    public markAllAsRead(addr: string) {
        const result = this.db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(addr);
        return result.changes;
    }

    // Deletions
    public softDeleteMail(id: string) {
        const result = this.db.prepare("UPDATE mail SET deleted = 1 WHERE id = ?").run(id);
        return result.changes;
    }

    public deleteMail(id: string) {
        const result = this.db.prepare("DELETE FROM mail WHERE id = ?").run(id);
        return result.changes;
    }

    public deleteMailsForAddress(addr: string) {
        const result = this.db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(addr);
        return result.changes;
    }

    public emptyDeletedMails(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = [
            'deleted = 1',
            this.getOwnerWhereClause(owner),
        ].filter(Boolean).join(' AND ');

        const sql = `DELETE FROM mail WHERE ${whereClause}`;

        const dbResult = this.db.prepare(sql).run(params);
        return dbResult.changes;
    }

    public restoreDeletedMails(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = [
            'deleted = 1',
            this.getOwnerWhereClause(owner),
        ].filter(Boolean).join(' AND ');

        const sql = `UPDATE mail SET deleted = 0 WHERE ${whereClause}`;

        const dbResult = this.db.prepare(sql).run(params);
        return dbResult.changes;
    }

    // Utility
    private getOwnerWhereClause(owner: string | undefined) {
        return owner && 'mail.recipient in (SELECT addr FROM address WHERE address.owner IS NULL OR address.owner = @owner)';
    }
}
