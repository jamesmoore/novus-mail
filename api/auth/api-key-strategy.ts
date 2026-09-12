import { Request } from 'express';
import { Strategy } from 'passport';
import { ApiKeyService } from './api-key-service.js';

export class ApiKeyStrategy extends Strategy {
    name = 'api-key';

    constructor(private readonly apiKeys: ApiKeyService) {
        super();
    }

    async authenticate(req: Request) {
        try {
            const authorization = req.get('authorization');
            const key = getApiKeyCredential(authorization);
            if (!key) {
                return this.fail({ message: 'API key required' }, 401);
            }

            const apiKey = await this.apiKeys.verify(key);
            if (!apiKey) {
                return this.fail({ message: 'Invalid API key' }, 401);
            }

            this.success({
                authType: 'api-key',
                accessMode: apiKey.accessMode,
                owner: apiKey.owner ?? undefined,
                apiKeyId: apiKey.id,
            });
        } catch (error) {
            this.error(error instanceof Error ? error : new Error(String(error)));
        }
    }
}

function getApiKeyCredential(authorization: string | undefined) {
    if (!authorization) {
        return undefined;
    }

    const separator = authorization.indexOf(' ');
    if (separator < 0 || authorization.slice(0, separator).toLowerCase() !== 'apikey') {
        return undefined;
    }

    let keyStart = separator + 1;
    while (keyStart < authorization.length && authorization.charCodeAt(keyStart) === 32) {
        keyStart++;
    }

    return keyStart < authorization.length ? authorization.slice(keyStart) : undefined;
}
