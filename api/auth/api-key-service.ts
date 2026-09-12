import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { ulid } from 'ulid';
import { DatabaseFacade } from '../db/database-facade.js';
import { ApiKeyAccessMode, ApiKeyRecord } from '../models/api-key.js';

const KEY_PREFIX = 'nvm';
const LAST_USED_UPDATE_INTERVAL_MS = 10 * 60 * 1000;

export class ApiKeyService {
    constructor(private readonly database: DatabaseFacade) { }

    async create(name: string, accessMode: ApiKeyAccessMode, owner: string | null, expiresAt: Date | null) {
        const keyPrefix = randomBytes(8).toString('hex');
        const secret = randomBytes(32).toString('base64url');
        const key = `${KEY_PREFIX}_${keyPrefix}_${secret}`;
        const record = {
            id: ulid(),
            name,
            accessMode,
            owner,
            keyPrefix,
            secretHash: this.hash(key),
            createdAt: new Date(),
            expiresAt,
        };

        await this.database.createApiKey(record);
        return {
            key,
            apiKey: {
                id: record.id,
                name: record.name,
                accessMode: record.accessMode,
                owner: record.owner,
                keyPrefix: record.keyPrefix,
                createdAt: record.createdAt,
                expiresAt: record.expiresAt,
                revokedAt: null,
                lastUsedAt: null,
            },
        };
    }

    async verify(key: string): Promise<ApiKeyRecord | undefined> {
        const match = key.match(/^nvm_([0-9a-f]{16})_([A-Za-z0-9_-]+)$/);
        if (!match) {
            return undefined;
        }

        const record = await this.database.getApiKeyByPrefix(match[1]);
        if (!record || record.revokedAt || (record.expiresAt && record.expiresAt <= new Date())) {
            return undefined;
        }

        const actual = Buffer.from(this.hash(key), 'hex');
        const expected = Buffer.from(record.secretHash, 'hex');
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
            return undefined;
        }

        const usedAt = new Date();
        await this.database.touchApiKeyLastUsed(
            record.id,
            usedAt,
            new Date(usedAt.getTime() - LAST_USED_UPDATE_INTERVAL_MS),
        );
        return record;
    }

    private hash(key: string) {
        return createHash('sha256').update(key, 'utf8').digest('hex');
    }
}
