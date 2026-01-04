import { Mail } from "./models/mail.js";
import { Address } from "./models/address.js";
import { DatabaseFacade } from "./database-facade.js";
import { UnreadCount } from "./models/unread-count.js";
import postgres from "postgres";
import { ulid } from "ulid";

export class PostgresDatabaseFacade implements DatabaseFacade {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    private sql: postgres.Sql<{}>;

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    constructor(db: postgres.Sql<{}>) {
        this.sql = db;
    }

    // Address
    public async addAddress(address: string) {
        await this.sql`INSERT INTO address ${this.sql({ id: ulid(), addr: address })}`;
    }

    public async getAddresses(sub: string | undefined) {
        const subClause = sub ? this.sql` OR owner = ${sub}` : this.sql``;
        return await this.sql<Address[]>`SELECT addr, owner FROM address WHERE owner is NULL ${subClause} ORDER BY id`;
    }

    public async getAddress(address: string) {
        const addr = await this.sql<Address[]>`SELECT addr, owner FROM address WHERE addr = ${address}`;
        return addr[0];
    }

    public async updateAddressOwner(address: string, owner: string | null | undefined) {
        await this.sql`UPDATE address SET owner = ${owner ?? null} WHERE addr = ${address}`;
    }

    public async deleteAddress(address: string) {
        await this.sql.begin(async (sql) => {
            await sql`DELETE FROM mail WHERE addressid = (SELECT id from address where addr = ${address})`;
            await sql`DELETE FROM address WHERE addr = ${address}`;
        });
    }

    public async getAddressCount() {
        const addressCountResult = await this.sql<{ addresses: number }[]>`SELECT count(*)::int as addresses from address`;
        return addressCountResult[0].addresses;
    }

    // Mails
    public async addMail(mail: Mail) {

        const address = await this.sql`SELECT id from address where addr = ${mail.recipient}` as { id: string }[];
        if (!address || address.length === 0) {
            throw new Error(`Recipient address not found for mail: ${mail.recipient}`);
        }
        await this.sql`
            INSERT INTO mail (id, addressid, sender, sendername, subject, content, read, received)
            VALUES (
                ${mail.id},
                ${address[0].id},
                ${mail.sender},
                ${mail.sendername ?? null},
                ${mail.subject},
                ${mail.content ?? ''},
                ${mail.read},
                ${mail.received}
            )`;
    }

    public async getMail(id: string): Promise<Mail | undefined> {
        const rows = await this.sql<Mail[]>`SELECT
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
            JOIN address on mail.addressid = address.id
            WHERE mail.id = ${id}`;
        if (rows.length === 0) {
            return undefined;
        }
        return rows[0];
    }

    public async getMails(addr: string, deleted: boolean, cursorId: string, perPage: number, owner: string | undefined, direction: string) {

        const deletedClause = this.sql` deleted = ${deleted ? 'true' : 'false'} `;

        const cursorClause = cursorId ?
            this.sql` AND mail.id ${direction === 'lt' ? this.sql`<` : this.sql`>`} ${cursorId}` :
            this.sql``;

        const addrClause = addr ?
            this.sql` AND address.addr = ${addr}` :
            this.sql``;

        const ownerClause = owner
            ? this.sql` AND ${this.getOwnerWhereClause(owner)}`
            : this.sql``;

        const sortOrder = direction === 'lt' ? this.sql`DESC` : this.sql`ASC`;

        const rows = await this.sql<Mail[]>`
              SELECT mail.id, sender, sendername, subject, read, received 
              FROM mail
              JOIN address on (address.id = addressid)
              WHERE
                ${deletedClause}
                ${cursorClause}
                ${addrClause}
                ${ownerClause}
              ORDER BY id ${sortOrder}
              LIMIT ${perPage}`;
        return rows;
    }

    public async getAllMails(owner: string | undefined) {
        const ownerClause = owner
            ? this.sql`WHERE ${this.getOwnerWhereClause(owner)}`
            : this.sql``;

        const rows = await this.sql<Mail[]>`
              SELECT mail.id, address.addr AS recipient, sender, sendername, subject, read, received, deleted, content
              FROM mail
              JOIN address on mail.addressid = address.id
              ${ownerClause}`;
        return rows;
    }

    // Unread
    public async getUnread(owner: string | undefined) {
        const ownerClause = owner
            ? this.sql`AND ${this.getOwnerWhereClause(owner)}`
            : this.sql``;
        const unread = await this.sql<UnreadCount[]>`
                SELECT address.addr AS recipient, count(*)::int as unread
                FROM mail
                JOIN address on (address.id = addressid)
                WHERE read = false AND deleted = false ${ownerClause}
                GROUP BY address.addr
                `;
        return unread;
    }

    public async markMailAsRead(mailId: string) {
        const result = await this.sql`UPDATE mail SET read = true where id = ${mailId}`;
        return result.count;
    }

    public async markAllAsRead(addr: string) {
        const result = await this.sql`UPDATE mail 
            SET read = true
            WHERE addressid = (SELECT id from address WHERE addr = ${addr}) AND read = false`;
        return result.count;
    }

    public async getUnreadMailsCount() {
        const unreadMailCount = await this.sql<{ unread: number }[]>`SELECT count(*)::int as unread 
            FROM mail
            WHERE read = false AND deleted = false`;
        return unreadMailCount[0].unread;
    }

    // Deletions
    public async softDeleteMail(id: string) {
        const result = await this.sql`UPDATE mail
            SET deleted = true
            WHERE id = ${id}`;
        return result.count;
    }

    public async deleteMail(id: string) {
        const result = await this.sql`DELETE FROM mail WHERE id = ${id}`;
        return result.count;
    }

    public async deleteMailsForAddress(addr: string) {
        const result = await this.sql`UPDATE mail
            SET deleted = true
            WHERE addressid = (SELECT id from address WHERE addr = ${addr}) AND deleted = false`;
        return result.count;
    }

    public async emptyDeletedMails(owner: string | undefined) {
        const whereClause = this.getOwnerWhereSubquery(owner);
        const result = await this.sql`DELETE FROM mail WHERE deleted = true ${whereClause}`;
        return result.count;
    }

    public async restoreDeletedMails(owner: string | undefined) {
        const whereClause = this.getOwnerWhereSubquery(owner);
        const result = await this.sql`UPDATE mail SET deleted = false WHERE deleted = true ${whereClause}`;
        return result.count;
    }

    // Utility
    private getOwnerWhereSubquery(owner: string | undefined) {
        return owner ?
            this.sql` AND mail.addressid IN (SELECT id FROM address WHERE address.owner IS NULL OR address.owner = ${owner})` :
            this.sql``
            ;
    }

    private getOwnerWhereClause(owner: string | undefined) {
        return owner ?
            this.sql`(address.owner IS NULL OR address.owner = ${owner})` :
            this.sql``
            ;
    }
}
