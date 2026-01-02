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
        return await this.sql`SELECT addr, owner FROM address WHERE owner is NULL ${subClause} ORDER BY id` as Address[];
    }

    public async getAddress(address: string) {
        const addr = await this.sql`SELECT addr, owner FROM address WHERE addr = ${address}` as Address[];
        return addr[0];
    }

    public async updateAddressOwner(address: string, owner: string | null | undefined) {
        await this.sql`UPDATE address SET owner = ${owner ?? null} WHERE addr = ${address}`;
    }

    public async deleteAddress(address: string) {
        await this.sql.begin(async (sql) => {
            await sql`DELETE FROM mail WHERE recipient = ${address}`;
            await sql`DELETE FROM address WHERE addr = ${address}`;
        });
    }

    public async getAddressCount() {
        const addressCountResult = await this.sql`SELECT count(*) as addresses from address` as { addresses: number }[];
        return addressCountResult[0].addresses;
    }

    // Mails
    public async addMail(mail: Mail) {
        await this.sql`
            INSERT INTO mail (id, recipient, sender, sendername, subject, content, read, received)
            VALUES (
                ${mail.id},
                ${mail.recipient},
                ${mail.sender},
                ${mail.sendername ?? null},
                ${mail.subject},
                ${mail.content ?? ''},
                ${mail.read},
                ${mail.received}
            )`;
    }

    public async getMail(id: string): Promise<Mail | undefined> {
        const rows = await this.sql`SELECT recipient, sender, sendername, subject, content, read, received, deleted FROM mail WHERE id = ${id}` as Mail[];
        if (rows.length === 0) {
            return undefined;
        }
        return rows[0];
    }

    public async getMails(addr: string, deleted: boolean, cursorId: string, perPage: number, owner: string | undefined, direction: string) {

        const deletedClause = deleted ? this.sql` deleted = true ` : this.sql` deleted = false `;

        const cursorClause = cursorId ?
            this.sql` AND id ${direction === 'lt' ? this.sql`<` : this.sql`>`} ${cursorId}` :
            this.sql``;

        const recipientClause = addr ?
            this.sql` AND recipient = ${addr}` :
            this.sql``;

        const ownerClause = this.getOwnerWhereClause(owner);

        const sortOrder = direction === 'lt' ? this.sql`DESC` : this.sql`ASC`;

        const rows = await this.sql`
              SELECT id, sender, sendername, subject, read, received 
              FROM mail 
              WHERE
                ${deletedClause}
                ${cursorClause}
                ${recipientClause}
                ${ownerClause}
              ORDER BY id ${sortOrder}
              LIMIT ${perPage}
            ` as Mail[];
        return rows;
    }

    public async getAllMails(owner: string | undefined) {
        const whereClause = this.getOwnerWhereClause(owner);

        const rows = await this.sql`
              SELECT id, recipient, sender, sendername, subject, read, received, deleted, content
              FROM mail 
              WHERE 1=1 ${whereClause}` as Mail[];
        return rows;
    }

    // Unread
    public async getUnread(owner: string | undefined) {
        const whereClause = this.getOwnerWhereClause(owner);
        const unread = await this.sql`
                SELECT recipient, count(*) as unread
                FROM mail
                WHERE read = false AND deleted = false ${whereClause}
                GROUP BY recipient
                ` as UnreadCount[];
        return unread;
    }

    public async markMailAsRead(mailId: string) {
        const result = await this.sql`UPDATE mail SET read = true where id = ${mailId}`;
        return result.count;
    }

    public async markAllAsRead(addr: string) {
        const result = await this.sql`UPDATE mail SET read = true where recipient = ${addr} and read = false`;
        return result.count;
    }

    public async getUnreadMailsCount() {
        const unreadMailCount = await this.sql`SELECT count(*) as unread from mail where read = false and deleted = false` as { unread: number }[];
        return unreadMailCount[0].unread;
    }

    // Deletions
    public async softDeleteMail(id: string) {
        const result = await this.sql`UPDATE mail SET deleted = true WHERE id = ${id}`;
        return result.count;
    }

    public async deleteMail(id: string) {
        const result = await this.sql`DELETE FROM mail WHERE id = ${id}`;
        return result.count;
    }

    public async deleteMailsForAddress(addr: string) {
        const result = await this.sql`UPDATE mail SET deleted = true WHERE recipient = ${addr} and deleted = false`;
        return result.count;
    }

    public async emptyDeletedMails(owner: string | undefined) {
        const whereClause = this.getOwnerWhereClause(owner);
        const result = await this.sql`DELETE FROM mail WHERE deleted = true ${whereClause}`;
        return result.count;
    }

    public async restoreDeletedMails(owner: string | undefined) {
        const whereClause = this.getOwnerWhereClause(owner);
        const result = await this.sql`UPDATE mail SET deleted = false WHERE deleted = true ${whereClause}`;
        return result.count;
    }

    // Utility
    private getOwnerWhereClause(owner: string | undefined) {
        return owner ?
            this.sql` AND mail.recipient IN (SELECT addr FROM address WHERE address.owner IS NULL OR address.owner = ${owner})` :
            this.sql``
            ;
    }
}
