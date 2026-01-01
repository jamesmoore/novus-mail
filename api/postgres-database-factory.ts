import postgres from 'postgres'
import { PostgresDatabaseFacade } from './postgres-database-facade.js';

export default async function dbinit(postgresUrl: string) {

    if (!postgresUrl) {
        throw Error("postgres url variable not set.")
    }

    const sql = postgres(postgresUrl);

    const addressCreate = await sql`
CREATE TABLE IF NOT EXISTS address (
    addr varchar(254) PRIMARY KEY,
    owner text
);`

    const mailCreate = await sql`
CREATE TABLE IF NOT EXISTS mail (
    id char(26) PRIMARY KEY,
    recipient varchar(254) NOT NULL,
    sender varchar(254) NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    received timestamptz NOT NULL DEFAULT now(),
    deleted boolean NOT NULL DEFAULT false,
    sendername text,
    CONSTRAINT fk_mail_recipient
        FOREIGN KEY (recipient)
        REFERENCES address(addr)
        ON DELETE RESTRICT
);`

    const metaCreate = await sql`
CREATE TABLE IF NOT EXISTS meta (
    key text PRIMARY KEY,
    value text NOT NULL
);`

    const mailRecipientIndexCreate = await sql`
CREATE INDEX IF NOT EXISTS idx_mail_recipient_received
    ON mail (recipient, received DESC);`


    const initialSchemaInsert = await sql`
INSERT INTO meta ${sql({ key: 'schemaVersion', value: '2' })} ON CONFLICT DO NOTHING;`;

    return new PostgresDatabaseFacade(sql);
}