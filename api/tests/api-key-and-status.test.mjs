import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { ApiKeyService } from '../dist/auth/api-key-service.js';
import { SqliteDatabaseFacade } from '../dist/db/sqlite-database-facade.js';

function createDatabase() {
    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE address (id TEXT PRIMARY KEY, addr TEXT NOT NULL UNIQUE, owner TEXT);
        CREATE TABLE mail (
            id TEXT PRIMARY KEY,
            addressid TEXT NOT NULL,
            sender TEXT NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            received INTEGER NOT NULL DEFAULT 0,
            deleted INTEGER NOT NULL DEFAULT 0,
            sendername TEXT
        );
        CREATE TABLE api_key (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            access_mode TEXT NOT NULL CHECK(access_mode IN ('owner', 'global')),
            owner TEXT,
            key_prefix TEXT NOT NULL UNIQUE,
            secret_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER,
            revoked_at INTEGER,
            last_used_at INTEGER,
            CHECK((access_mode = 'owner' AND owner IS NOT NULL) OR (access_mode = 'global' AND owner IS NULL))
        );
    `);
    return db;
}

test('status counts include shared and matching owner data', async () => {
    const db = createDatabase();
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('shared', 'shared@example.test', null);
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('alice', 'alice@example.test', 'alice-sub');
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('bob', 'bob@example.test', 'bob-sub');
    const insertMail = db.prepare(`INSERT INTO mail
        (id, addressid, sender, subject, content, read, deleted) VALUES (?, ?, '', '', '', ?, ?)`);
    insertMail.run('m1', 'shared', 0, 0);
    insertMail.run('m2', 'alice', 0, 0);
    insertMail.run('m3', 'bob', 0, 0);
    insertMail.run('m4', 'alice', 1, 0);
    insertMail.run('m5', 'alice', 0, 1);

    const facade = new SqliteDatabaseFacade(db);
    assert.equal(await facade.getAddressCount('alice-sub'), 2);
    assert.equal(await facade.getUnreadMailsCount('alice-sub'), 2);
    assert.equal(await facade.getAddressCount(undefined), 3);
    assert.equal(await facade.getUnreadMailsCount(undefined), 3);
    db.close();
});

test('API keys are hashed, authenticate, and stop authenticating after revocation', async () => {
    const db = createDatabase();
    const facade = new SqliteDatabaseFacade(db);
    const service = new ApiKeyService(facade);
    const created = await service.create('status monitor', 'owner', 'alice-sub', null);

    const stored = db.prepare('SELECT secret_hash, last_used_at FROM api_key').get();
    assert.notEqual(stored.secret_hash, created.key);
    assert.equal(stored.secret_hash.includes(created.key), false);

    const verified = await service.verify(created.key);
    assert.equal(verified?.owner, 'alice-sub');
    assert.equal(verified?.accessMode, 'owner');
    assert.ok(db.prepare('SELECT last_used_at FROM api_key').get().last_used_at);

    assert.equal(await facade.revokeApiKey(created.apiKey.id, 'alice-sub'), 1);
    assert.equal(await service.verify(created.key), undefined);
    db.close();
});

test('API-key schema rejects ambiguous access-mode and owner combinations', () => {
    const db = createDatabase();
    const insert = db.prepare(`INSERT INTO api_key
        (id, name, access_mode, owner, key_prefix, secret_hash, created_at)
        VALUES (?, 'bad', ?, ?, ?, 'hash', 0)`);

    assert.throws(() => insert.run('1', 'owner', null, 'one'));
    assert.throws(() => insert.run('2', 'global', 'alice-sub', 'two'));
    db.close();
});
