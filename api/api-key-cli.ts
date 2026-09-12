import 'dotenv/config';
import { ApiKeyService } from './auth/api-key-service.js';
import { DatabaseFacade } from './db/database-facade.js';
import initPostgres from './db/postgres-database-factory.js';
import initSqlite from './db/sqlite-database-factory.js';
import { env } from './env/env.js';

async function getDatabase(): Promise<DatabaseFacade> {
    return env.POSTGRES_URL
        ? await initPostgres(env.POSTGRES_URL, env.POSTGRES_LOG_SQL)
        : initSqlite()!;
}

async function main() {
    const [command, value] = process.argv.slice(2);
    const database = await getDatabase();

    if (command === 'create-global') {
        const name = value?.trim();
        if (!name) {
            throw new Error('Usage: npm run api-key -- create-global <name>');
        }
        const created = await new ApiKeyService(database).create(name, 'global', null, null);
        console.log(JSON.stringify(created, null, 2));
        return;
    }

    if (command === 'list-global') {
        console.log(JSON.stringify(await database.listGlobalApiKeys(), null, 2));
        return;
    }

    if (command === 'revoke-global') {
        if (!value) {
            throw new Error('Usage: npm run api-key -- revoke-global <id>');
        }
        const changed = await database.revokeGlobalApiKey(value);
        if (!changed) {
            throw new Error(`Active global API key not found: ${value}`);
        }
        console.log(`Revoked global API key ${value}`);
        return;
    }

    throw new Error('Usage: npm run api-key -- <create-global <name> | list-global | revoke-global <id>>');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
