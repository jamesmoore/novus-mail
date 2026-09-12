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
            const match = authorization?.match(/^ApiKey\s+(.+)$/i);
            if (!match) {
                return this.fail({ message: 'API key required' }, 401);
            }

            const apiKey = await this.apiKeys.verify(match[1]);
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
