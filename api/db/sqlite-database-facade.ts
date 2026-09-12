import { Database } from "better-sqlite3";
import { Mail } from "../models/mail.js";
import { Address } from "../models/address.js";
import { DatabaseFacade } from "./database-facade.js";
import { UnreadCount } from "../models/unread-count.js";
import { ulid } from "ulid";
import { ApiKeyMetadata, ApiKeyRecord, NewApiKeyRecord } from "../models/api-key.js";

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
        this.db.prepare("INSERT INTO address (id, addr) VALUES (@id, @address)").run({ id: ulid(), address });
    }

    public async getAddresses(sub: string | undefined): Promise<Address[]> {
        return this.db.prepare(`SELECT addr, owner 
            FROM address 
            WHERE owner is NULL or owner = @owner
            ORDER BY id
            `).all({ owner: sub }) as Address[];
    }

    public async getAddress(address: string) {
        return this.db.prepare("SELECT addr, owner FROM address WHERE addr = @address").get({ address }) as Address;
    }

    public async updateAddressOwner(address: string, owner: string | null | undefined) {
        this.db.prepare("UPDATE address SET owner = @owner WHERE addr = @address").run({ owner, address });
    }

    public async deleteAddress(address: string) {
        this.db.prepare("DELETE FROM mail WHERE addressid = (SELECT id from address where addr = @address)").run({ address });
        this.db.prepare("DELETE FROM address WHERE addr = @address").run({ address });
    }

    public async getAddressCount(owner: string | undefined) {
        const ownerClause = owner ? ' WHERE owner IS NULL OR owner = @owner' : '';
        const addressCountResult = this.db.prepare(`SELECT count(*) as addresses from address${ownerClause}`).get({ owner }) as { addresses: number };
        return addressCountResult.addresses;
    }

    // Mails
    public async addMail(mail: Mail) {
        const address = this.db.prepare('SELECT id from address where addr = @address').get({ address: mail.recipient }) as { id: string } | undefined;
        if (!address) {
            throw new Error(`Recipient address not found for mail: ${mail.recipient}`);
        }
        this.db.prepare(`INSERT INTO mail (id, addressid, sender, sendername, subject, content, read, received, deleted) 
            VALUES (@id, @addressid, @sender, @sendername, @subject, @content, @read, @received, @deleted)`).
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
            WHERE mail.id = @id`).get({ id }) as SqliteMailRowWithRecipient;
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
                GROUP BY address.addr
                `).all(params);
        return unread as UnreadCount[];
    }

    public async markMailAsRead(mailId: string) {
        const result = this.db.prepare("UPDATE mail SET read = 1 where id = @id").run({ id: mailId });
        return result.changes;
    }

    public async markAllAsRead(addr: string) {
        // NOTE TO REVIEWERS: UPDATE FROM is present in this version of sqlite
        const result = this.db.prepare(`UPDATE mail 
            SET read = 1 
            FROM address
            WHERE address.id = addressid AND address.addr = @address and read = 0`).run({ address: addr });
        return result.changes;
    }

    public async getUnreadMailsCount(owner: string | undefined) {
        const ownerClause = owner ? ' AND (address.owner IS NULL OR address.owner = @owner)' : '';
        const unreadMailCount = this.db.prepare(`SELECT count(*) as unread
            FROM mail
            JOIN address ON address.id = mail.addressid
            WHERE read = 0 AND deleted = 0${ownerClause}`).get({ owner }) as { unread: number };
        return unreadMailCount.unread;
    }

    // API keys
    public async createApiKey(apiKey: NewApiKeyRecord) {
        this.db.prepare(`INSERT INTO api_key
            (id, name, access_mode, owner, key_prefix, secret_hash, created_at, expires_at)
            VALUES (@id, @name, @accessMode, @owner, @keyPrefix, @secretHash, @createdAt, @expiresAt)`)
            .run({
                ...apiKey,
                createdAt: apiKey.createdAt.getTime(),
                expiresAt: apiKey.expiresAt?.getTime() ?? null,
            });
    }

    public async getApiKeyByPrefix(prefix: string) {
        const row = this.db.prepare(`SELECT id, name, access_mode AS accessMode, owner,
            key_prefix AS keyPrefix, secret_hash AS secretHash, created_at AS createdAt,
            expires_at AS expiresAt, revoked_at AS revokedAt, last_used_at AS lastUsedAt
            FROM api_key WHERE key_prefix = @prefix`).get({ prefix }) as SqliteApiKeyRow | undefined;
        return row ? mapApiKey(row) : undefined;
    }

    public async listApiKeys(owner: string) {
        const rows = this.db.prepare(`SELECT id, name, access_mode AS accessMode, owner,
            key_prefix AS keyPrefix, secret_hash AS secretHash, created_at AS createdAt,
            expires_at AS expiresAt, revoked_at AS revokedAt, last_used_at AS lastUsedAt
            FROM api_key WHERE access_mode = 'owner' AND owner = @owner ORDER BY created_at DESC`)
            .all({ owner }) as SqliteApiKeyRow[];
        return rows.map(mapApiKeyMetadata);
    }

    public async listGlobalApiKeys() {
        const rows = this.db.prepare(`SELECT id, name, access_mode AS accessMode, owner,
            key_prefix AS keyPrefix, secret_hash AS secretHash, created_at AS createdAt,
            expires_at AS expiresAt, revoked_at AS revokedAt, last_used_at AS lastUsedAt
            FROM api_key WHERE access_mode = 'global' ORDER BY created_at DESC`)
            .all() as SqliteApiKeyRow[];
        return rows.map(mapApiKeyMetadata);
    }

    public async touchApiKeyLastUsed(id: string, usedAt: Date) {
        this.db.prepare('UPDATE api_key SET last_used_at = @usedAt WHERE id = @id')
            .run({ id, usedAt: usedAt.getTime() });
    }

    public async revokeApiKey(id: string, owner: string) {
        const result = this.db.prepare(`UPDATE api_key SET revoked_at = @revokedAt
            WHERE id = @id AND access_mode = 'owner' AND owner = @owner AND revoked_at IS NULL`)
            .run({ id, owner, revokedAt: Date.now() });
        return result.changes;
    }

    public async revokeGlobalApiKey(id: string) {
        const result = this.db.prepare(`UPDATE api_key SET revoked_at = @revokedAt
            WHERE id = @id AND access_mode = 'global' AND revoked_at IS NULL`)
            .run({ id, revokedAt: Date.now() });
        return result.changes;
    }

    // Deletions
    public async softDeleteMail(id: string) {
        const result = this.db.prepare("UPDATE mail SET deleted = 1 WHERE id = @id").run({ id });
        return result.changes;
    }

    public async deleteMail(id: string) {
        const result = this.db.prepare("DELETE FROM mail WHERE id = @id").run({ id });
        return result.changes;
    }

    public async deleteMailsForAddress(addr: string) {
        // NOTE TO REVIEWERS: UPDATE FROM is present in this version of sqlite
        const result = this.db.prepare(`UPDATE mail 
            SET deleted = 1 
            FROM address
            WHERE address.id = addressid AND address.addr = @address and deleted = 0`).run({ address: addr });
        return result.changes;
    }

    public async emptyDeletedMails(owner: string | undefined) {
        const params = {
            owner: owner,
        };

        const whereClause = [
            'deleted = 1',
            this.getOwnerWhereSubquery(owner),
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
            this.getOwnerWhereSubquery(owner),
        ].filter(Boolean).join(' AND ');

        const sql = `UPDATE mail SET deleted = 0 WHERE ${whereClause}`;

        const dbResult = this.db.prepare(sql).run(params);
        return dbResult.changes;
    }

    // Utility
    private getOwnerWhereSubquery(owner: string | undefined) {
        return owner && 'mail.addressid in (SELECT id FROM address WHERE address.owner IS NULL OR address.owner = @owner)';
    }

    private getOwnerWhereClause(owner: string | undefined) {
        return owner && '(address.owner IS NULL OR address.owner = @owner)';
    }
}

type SqliteApiKeyRow = Omit<ApiKeyRecord, 'createdAt' | 'expiresAt' | 'revokedAt' | 'lastUsedAt'> & {
    createdAt: number;
    expiresAt: number | null;
    revokedAt: number | null;
    lastUsedAt: number | null;
};

function mapApiKey(row: SqliteApiKeyRow): ApiKeyRecord {
    return {
        ...row,
        createdAt: new Date(row.createdAt),
        expiresAt: row.expiresAt === null ? null : new Date(row.expiresAt),
        revokedAt: row.revokedAt === null ? null : new Date(row.revokedAt),
        lastUsedAt: row.lastUsedAt === null ? null : new Date(row.lastUsedAt),
    };
}

function mapApiKeyMetadata(row: SqliteApiKeyRow): ApiKeyMetadata {
    return {
        id: row.id,
        name: row.name,
        accessMode: row.accessMode,
        owner: row.owner,
        keyPrefix: row.keyPrefix,
        createdAt: new Date(row.createdAt),
        expiresAt: row.expiresAt === null ? null : new Date(row.expiresAt),
        revokedAt: row.revokedAt === null ? null : new Date(row.revokedAt),
        lastUsedAt: row.lastUsedAt === null ? null : new Date(row.lastUsedAt),
    };
}
