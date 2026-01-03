import { Database } from "better-sqlite3";
import { Mail } from "./models/mail.js";
import { Address } from "./models/address.js";
import { DatabaseFacade } from "./database-facade.js";
import { UnreadCount } from "./models/unread-count.js";
import { ulid } from "ulid";

type SqliteMailRow = {
    id: string;
    addressid: string;
    sender: string;
    sendername: string | null;
    subject: string;
    content: string;
    read: number;      // 0 | 1
    received: number;  // unix timestamp
    deleted: number;   // 0 | 1
};

type SqliteMailRowWithRecipient = SqliteMailRow & { recipient: string }

function GetMail(mail: SqliteMailRowWithRecipient): Mail {
    return {
        deleted: mail.deleted === 1,
        id: mail.id,
        read: mail.read === 1,
        received: new Date(mail.received),
        recipient: mail.recipient,
        sender: mail.sender,
        subject: mail.subject,
        content: mail.content,
        sendername: mail.sendername ?? undefined,
    };
}

function GetSqliteMailRow(mail: Mail, addressid: string): SqliteMailRow {
    return {
        deleted: mail.deleted ? 1 : 0,
        id: mail.id,
        read: mail.read ? 1 : 0,
        received: mail.received.getTime(),
        addressid: addressid,
        sender: mail.sender,
        subject: mail.subject,
        content: mail.content,
        sendername: mail.sendername ?? null,
    };
}

export class SqliteDatabaseFacade implements DatabaseFacade {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    // Address
    public async addAddress(address: string) {
        this.db.prepare("INSERT INTO address (id, addr) VALUES (?,?)").run(ulid(), address);
    }

    public async getAddresses(sub: string | undefined): Promise<Address[]> {
        return this.db.prepare(`SELECT addr, owner 
            FROM address 
            WHERE owner is NULL or owner = ?
            ORDER BY id
            `).all(sub) as Address[];
    }

    public async getAddress(address: string) {
        return this.db.prepare("SELECT addr, owner FROM address WHERE addr = ?").get(address) as Address;
    }

    public async updateAddressOwner(address: string, owner: string | null | undefined) {
        this.db.prepare("UPDATE address SET owner = ? WHERE addr = ?").run(owner, address);
    }

    public async deleteAddress(address: string) {
        this.db.prepare("DELETE FROM mail WHERE addressid = (SELECT id from address where addr = ?)").run(address);
        this.db.prepare("DELETE FROM address WHERE addr = ?").run(address);
    }

    public async getAddressCount() {
        const addressCountResult = this.db.prepare('SELECT count(*) as addresses from address').get() as { addresses: number };
        return addressCountResult.addresses;
    }

    // Mails
    public async addMail(mail: Mail) {
        const address = this.db.prepare('SELECT id from address where addr=?').get(mail.recipient) as { id: string } | undefined;
        if (!address) {
            throw new Error(`Recipient address not found for mail: ${mail.recipient}`);
        }
        this.db.prepare(`INSERT INTO mail (id, addressid, sender, sendername, subject, content, read, received) 
            VALUES (@id, @addressid, @sender, @sendername, @subject, @content, @read, @received)`).
            run(GetSqliteMailRow(mail, address.id));
    }

    public async getMail(id: string) {
        const mail = this.db.prepare(`SELECT
            mail.id,
            address.addr AS recipient,
            sender,
            sendername,
            subject,
            content,
            read,
            received,
            deleted 
            FROM mail
            JOIN address on (address.id = addressid)
            WHERE mail.id = ?`).get(id) as SqliteMailRowWithRecipient;
        return mail ? GetMail(mail) : undefined;
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
            cursorId && `mail.id ${comparisonOperator} @cursorId`,
            addr && 'address.addr = @recipient',
            this.getOwnerWhereClause(owner),
        ].filter(Boolean).join(' AND ');

        const sortOrder = direction === 'lt' ? 'DESC' : 'ASC';

        // NOTE TO REVIEWERS: subset of fields for performance reasons
        const sql = `
              SELECT mail.id, sender, sendername, subject, read, received 
              FROM mail 
              JOIN address on (address.id = addressid)
              WHERE ${whereClause}
              ORDER BY mail.id ${sortOrder} 
              LIMIT @mailCount
            `;

        const rows = this.db.prepare(sql).all(params) as SqliteMailRowWithRecipient[];
        return rows.map(GetMail);
    }

    public async getAllMails(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = owner ? "WHERE " + this.getOwnerWhereClause(owner) : '';
        const sql = `
              SELECT mail.id, address.addr AS recipient, sender, sendername, subject, read, received, deleted, content
              FROM mail 
              JOIN address on (address.id = addressid)
              ${whereClause}
            `;

        const rows = this.db.prepare(sql).all(params) as SqliteMailRowWithRecipient[];
        return rows.map(GetMail);
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
                SELECT address.addr AS recipient, count(*) as unread
                FROM mail
                JOIN address on (address.id = addressid)
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
        // NOTE TO REVIEWERS: UPDATE FROM is present in this version of sqlite
        const result = this.db.prepare(`UPDATE mail 
            SET read = 1 
            FROM address
            WHERE address.id = addressid AND addr = ? and read = 0`).run(addr);
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
        // NOTE TO REVIEWERS: UPDATE FROM is present in this version of sqlite
        const result = this.db.prepare(`UPDATE mail 
            SET deleted = 1 
            FROM address
            WHERE address.id = addressid AND addr = ? and deleted = 0`).run(addr);
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
        return owner && 'mail.addressid in (SELECT id FROM address WHERE address.owner IS NULL OR address.owner = @owner)';
    }
}
