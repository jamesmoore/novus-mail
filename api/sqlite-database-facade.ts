import { Database } from "better-sqlite3";
import { Mail } from "./models/mail.js";
import { Address } from "./models/address.js";
import { DatabaseFacade } from "./database-facade.js";
import { UnreadCount } from "./models/unread-count.js";

export class SqliteDatabaseFacade implements DatabaseFacade {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    // Address
    public async addAddress(address: string) {
        this.db.prepare("INSERT INTO address (addr) VALUES (?)").run(address);
    }

    public async getAddresses(sub: string | undefined): Promise<Address[]> {
        return this.db.prepare("SELECT addr, owner FROM address WHERE owner is NULL or owner = ?").all(sub) as Address[];
    }

    public async getAddress(address: string) {
        return this.db.prepare("SELECT addr, owner FROM address WHERE addr = ?").get(address) as Address;
    }

    public async updateAddressOwner(address: string, owner: string | null | undefined) {
        this.db.prepare("UPDATE address SET owner = ? WHERE addr = ?").run(owner, address);
    }

    public async deleteAddress(address: string) {
        this.db.prepare("DELETE FROM mail WHERE recipient = ?").run(address);
        this.db.prepare("DELETE FROM address WHERE addr = ?").run(address);
    }

    public async getAddressCount() {
        const addressCountResult = this.db.prepare('SELECT count(*) as addresses from address').get() as { addresses: number };
        return addressCountResult.addresses;
    }

    // Mails
    public async addMail(mail: Mail) {
        this.db.prepare("INSERT INTO mail (id, recipient, sender, sendername, subject, content, read, received) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").
            run(mail.id, mail.recipient, mail.sender, mail.sendername, mail.subject, mail.content, mail.read, mail.received);
    }

    public async getMail(id: string) {
        const rows = this.db.prepare("SELECT recipient, sender, sendername, subject, content, read, received, deleted FROM mail WHERE id = ?").all(id);
        const mail = rows[0] as Mail;
        return mail;
    }

    public async getMails(addr: string, deleted: boolean, cursorId: string, perPage: number, owner: string | undefined, direction: string) {
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

    public async getAllMails(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = owner ? "WHERE " + this.getOwnerWhereClause(owner) : '';
        const sql = `
              SELECT id, recipient, sender, sendername, subject, read, received, deleted, content
              FROM mail 
              ${whereClause}
            `;

        const rows = this.db.prepare(sql).all(params) as Mail[];
        return rows;
    }

    // Unread
    public async getUnread(owner: string | undefined) {
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
        return unread as UnreadCount[];
    }

    public async markMailAsRead(mailId: string) {
        const result = this.db.prepare("UPDATE mail SET read = 1 where id = ?").run(mailId);
        return result.changes;
    }

    public async markAllAsRead(addr: string) {
        const result = this.db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(addr);
        return result.changes;
    }

    public async getUnreadMailsCount() {
        const unreadMailCount = this.db.prepare('SELECT count(*) as unread from mail where read = 0 and deleted = 0').get() as { unread: number };
        return unreadMailCount.unread;
    }

    // Deletions
    public async softDeleteMail(id: string) {
        const result = this.db.prepare("UPDATE mail SET deleted = 1 WHERE id = ?").run(id);
        return result.changes;
    }

    public async deleteMail(id: string) {
        const result = this.db.prepare("DELETE FROM mail WHERE id = ?").run(id);
        return result.changes;
    }

    public async deleteMailsForAddress(addr: string) {
        const result = this.db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(addr);
        return result.changes;
    }

    public async emptyDeletedMails(owner: string | undefined) {
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

    public async restoreDeletedMails(owner: string | undefined) {
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
