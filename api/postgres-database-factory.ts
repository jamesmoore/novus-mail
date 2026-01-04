import postgres from 'postgres'
import { PostgresDatabaseFacade } from './postgres-database-facade.js';

export default async function dbinit(postgresUrl: string) {

    if (!postgresUrl) {
        throw Error("Postgres URL variable not set");
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(postgresUrl);
    } catch (e) {
        throw new Error(`Invalid Postgres URL format: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
        throw new Error(`Invalid Postgres URL protocol: ${parsedUrl.protocol}. Expected "postgres" or "postgresql".`);
    }

    let sql;
    try {
        sql = postgres(postgresUrl);
    } catch (e) {
        throw new Error(`Failed to initialize Postgres client: ${e instanceof Error ? e.message : String(e)}`);
    }
    console.log("Starting DB schema update...");
    try {
        await sql.begin(async (tx) => {
            await tx`
CREATE TABLE IF NOT EXISTS address (
    id char(26) PRIMARY KEY,
    addr varchar(254) NOT NULL,
    owner text,
    UNIQUE(addr)
);`

            await tx`
CREATE TABLE IF NOT EXISTS mail (
    id char(26) PRIMARY KEY,
    addressid char(26) NOT NULL,
    sender varchar(254) NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    received timestamptz NOT NULL DEFAULT now(),
    deleted boolean NOT NULL DEFAULT false,
    sendername text,
    CONSTRAINT fk_mail_addressid
        FOREIGN KEY (addressid)
        REFERENCES address(id)
        ON DELETE RESTRICT
);`

            await tx`
CREATE TABLE IF NOT EXISTS meta (
    key text PRIMARY KEY,
    value text NOT NULL
);`

            await tx`
CREATE INDEX IF NOT EXISTS idx_mail_id_addressid
    ON mail (id DESC, addressid);`

            await tx`
INSERT INTO meta ${tx({ key: 'schemaVersion', value: '3' })} ON CONFLICT DO NOTHING;`;
        });
        console.log("Completed DB schema update");
    } catch (e) {
        throw new Error(`Failed to initialize database schema: ${e instanceof Error ? e.message : String(e)}`);
    }

    return new PostgresDatabaseFacade(sql);
}
