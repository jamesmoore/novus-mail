import assert from 'node:assert/strict';
import test from 'node:test';
import { AddressInfo } from 'node:net';
import Database from 'better-sqlite3';
import express from 'express';
import passport from 'passport';
import { ApiKeyService } from '../auth/api-key-service.js';
import {
    configureStatusAuthentication,
    createStatusAuthenticationMiddleware,
} from '../auth/status-auth-middleware.js';
import { SqliteDatabaseFacade } from '../db/sqlite-database-facade.js';
import { createRouter as createStatusRouter } from '../routes/status-routes.js';

type StoredApiKeyUsage = {
    secret_hash: string;
    last_used_at: number | null;
};

type LastUsedRow = {
    last_used_at: number | null;
};

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

    const stored = db.prepare('SELECT secret_hash, last_used_at FROM api_key').get() as StoredApiKeyUsage | undefined;
    assert.ok(stored);
    assert.notEqual(stored.secret_hash, created.key);
    assert.equal(stored.secret_hash.includes(created.key), false);

    const verified = await service.verify(created.key);
    assert.equal(verified?.owner, 'alice-sub');
    assert.equal(verified?.accessMode, 'owner');
    const firstUsage = db.prepare('SELECT last_used_at FROM api_key').get() as LastUsedRow | undefined;
    assert.ok(firstUsage);
    const firstLastUsed = firstUsage.last_used_at;
    assert.ok(firstLastUsed);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await service.verify(created.key);
    const secondUsage = db.prepare('SELECT last_used_at FROM api_key').get() as LastUsedRow | undefined;
    assert.ok(secondUsage);
    assert.equal(secondUsage.last_used_at, firstLastUsed);

    assert.equal(await facade.revokeApiKey(created.apiKey.id, 'alice-sub'), 1);
    assert.equal(await service.verify(created.key), undefined);
    db.close();
});

test('OIDC status HTTP authentication selects owner and global visibility', async () => {
    const db = createDatabase();
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('shared', 'shared@example.test', null);
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('alice', 'alice@example.test', 'alice-sub');
    db.prepare('INSERT INTO address (id, addr, owner) VALUES (?, ?, ?)').run('bob', 'bob@example.test', 'bob-sub');
    const insertMail = db.prepare(`INSERT INTO mail
        (id, addressid, sender, subject, content, read, deleted) VALUES (?, ?, '', '', '', 0, 0)`);
    insertMail.run('m1', 'shared');
    insertMail.run('m2', 'alice');
    insertMail.run('m3', 'bob');

    const facade = new SqliteDatabaseFacade(db);
    const apiKeys = new ApiKeyService(facade);
    const ownerKey = await apiKeys.create('Alice monitor', 'owner', 'alice-sub', null);
    const globalKey = await apiKeys.create('Global monitor', 'global', null, null);
    configureStatusAuthentication(facade);

    const app = express();
    app.use(passport.initialize());
    app.use((req, _res, next) => {
        const subject = req.get('x-test-oidc-sub');
        if (subject) {
            req.user = { sub: subject };
            req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
        }
        next();
    });
    app.use('/api', createStatusRouter(facade, createStatusAuthenticationMiddleware('oidc')));
    app.get('/api/mail-probe', (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(401).send();
            return;
        }
        res.json({ ok: true });
    });

    const server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
        const health = await fetch(`${baseUrl}/api/health`);
        assert.equal(health.status, 200);

        assert.equal((await fetch(`${baseUrl}/api/status`)).status, 401);
        assert.equal((await fetch(`${baseUrl}/api/status`, {
            headers: { Authorization: 'ApiKey invalid' },
        })).status, 401);
        assert.equal((await fetch(`${baseUrl}/api/status`, {
            headers: { Authorization: 'ApiKey                              ' },
        })).status, 401);
        assert.equal((await fetch(`${baseUrl}/api/status`, {
            headers: { Authorization: 'Bearer invalid' },
        })).status, 401);

        const oidcStatus = await fetch(`${baseUrl}/api/status`, {
            headers: { 'x-test-oidc-sub': 'alice-sub' },
        });
        assert.deepEqual(await oidcStatus.json(), { unread: 2, addresses: 2 });

        const ownerStatus = await fetch(`${baseUrl}/api/status`, {
            headers: { Authorization: `ApiKey ${ownerKey.key}` },
        });
        assert.deepEqual(await ownerStatus.json(), { unread: 2, addresses: 2 });

        const globalStatus = await fetch(`${baseUrl}/api/status`, {
            headers: { Authorization: `ApiKey ${globalKey.key}` },
        });
        assert.deepEqual(await globalStatus.json(), { unread: 3, addresses: 3 });

        const mailProbe = await fetch(`${baseUrl}/api/mail-probe`, {
            headers: { Authorization: `ApiKey ${ownerKey.key}` },
        });
        assert.equal(mailProbe.status, 401);
    } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        db.close();
    }
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
