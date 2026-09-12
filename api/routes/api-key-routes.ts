import { Router } from 'express';
import { DatabaseFacade } from '../db/database-facade.js';
import { ApiKeyService } from '../auth/api-key-service.js';
import { noCacheMiddleware } from './no-cache-middleware.js';

export function createRouter(database: DatabaseFacade) {
    const router = Router();
    const apiKeys = new ApiKeyService(database);
    router.use(noCacheMiddleware);

    router.use((req, res, next) => {
        if (!req.isAuthenticated() || !req.user?.sub) {
            res.status(401).send();
            return;
        }
        next();
    });

    router.get('/', async (req, res) => {
        const keys = await database.listApiKeys(req.user!.sub!);
        res.json(keys);
    });

    router.post('/', async (req, res) => {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        if (!name || name.length > 100) {
            res.status(400).json({ error: 'name must be between 1 and 100 characters' });
            return;
        }

        let expiresAt: Date | null = null;
        if (req.body?.expiresAt !== undefined && req.body.expiresAt !== null) {
            expiresAt = new Date(req.body.expiresAt);
            if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
                res.status(400).json({ error: 'expiresAt must be a future date' });
                return;
            }
        }

        const created = await apiKeys.create(name, 'owner', req.user!.sub!, expiresAt);
        res.status(201).json(created);
    });

    router.delete('/:id', async (req, res) => {
        const changes = await database.revokeApiKey(req.params.id, req.user!.sub!);
        if (!changes) {
            res.status(404).send();
            return;
        }
        res.status(204).send();
    });

    return router;
}
